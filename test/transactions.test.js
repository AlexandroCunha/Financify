// A time zone far from UTC: dates must not change (in the old version they went back a day).
process.env.TZ = 'Pacific/Kiritimati'

const { describe, it, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const h = require('./helpers')

before(() => h.start())
after(() => h.stop())
beforeEach(() => h.resetDatabase())

describe('POST /transactions', () => {
  it('creates and returns the transaction with the category name and the exact date', async () => {
    const { token } = await h.createSignedInUser()
    const data = h.newTransaction({ description: 'Salary', amount: 500000, date: '2026-10-01', type: 'income', category_id: h.categories.Salary })
    const { status, body } = await h.api('POST', '/transactions', { token, body: data })
    assert.equal(status, 201)
    assert.equal(body.date, '2026-10-01')
    assert.equal(body.amount, 500000)
    assert.equal(body.category_name, 'Salary')
    assert.equal('user_id' in body, false)
  })

  const invalid = [
    ['a negative amount', 'amount', -999],
    ['a zero amount', 'amount', 0],
    ['a decimal amount', 'amount', 10.5],
    ['an amount as text', 'amount', 'abc'],
    ['a date in another format', 'date', '01/10/2026'],
    ['a date that does not exist', 'date', '2026-02-30'],
    ['a date in words', 'date', 'yesterday'],
    ['an unknown type', 'type', 'debit'],
    ['a category as text', 'category_id', 'abc'],
    ['a blank description', 'description', '   '],
  ]
  for (const [scenario, field, value] of invalid) {
    it(`refuses ${scenario} with 400 (before: accepted or error 500)`, async () => {
      const { token } = await h.createSignedInUser()
      const { status, body } = await h.api('POST', '/transactions', { token, body: h.newTransaction({ [field]: value }) })
      assert.equal(status, 400)
      assert.ok(body.errors?.[field], `expected an error on ${field}: ${JSON.stringify(body)}`)
    })
  }

  it('refuses a category that does not exist (400)', async () => {
    const { token } = await h.createSignedInUser()
    const { status, body } = await h.api('POST', '/transactions', { token, body: h.newTransaction({ category_id: 9999 }) })
    assert.equal(status, 400)
    assert.deepEqual(body.errors, { category_id: 'category not found' })
  })
})

describe('GET /transactions/:id', () => {
  it('returns an object (before: a list with one item)', async () => {
    const { token } = await h.createSignedInUser()
    const created = await h.createTransaction(token)
    const { status, body } = await h.api('GET', `/transactions/${created.id}`, { token })
    assert.equal(status, 200)
    assert.deepEqual(body, created)
  })

  it('an id that is not a number or too big: 400 (before: 500)', async () => {
    const { token } = await h.createSignedInUser()
    for (const id of ['abc', '1.5', '99999999999']) {
      const { status } = await h.api('GET', `/transactions/${id}`, { token })
      assert.equal(status, 400, `id ${id}`)
    }
  })

  it('not found: 404', async () => {
    const { token } = await h.createSignedInUser()
    const { status, body } = await h.api('GET', '/transactions/12345', { token })
    assert.equal(status, 404)
    assert.deepEqual(body, { message: 'Transaction not found.' })
  })
})

describe('PUT and DELETE /transactions/:id', () => {
  it('PUT updates and returns the transaction', async () => {
    const { token } = await h.createSignedInUser()
    const created = await h.createTransaction(token)
    const newData = h.newTransaction({ description: 'Cinema', amount: 4500, date: '2026-10-12', category_id: h.categories.Leisure })
    const { status, body } = await h.api('PUT', `/transactions/${created.id}`, { token, body: newData })
    assert.equal(status, 200)
    assert.equal(body.description, 'Cinema')
    assert.equal(body.amount, 4500)
    assert.equal(body.category_name, 'Leisure')
    assert.ok(new Date(body.updated_at) >= new Date(created.updated_at))
  })

  it('PUT validates the data (400)', async () => {
    const { token } = await h.createSignedInUser()
    const created = await h.createTransaction(token)
    const { status, body } = await h.api('PUT', `/transactions/${created.id}`, { token, body: { amount: -1 } })
    assert.equal(status, 400)
    assert.ok(body.errors.amount)
    assert.ok(body.errors.description)
  })

  it('DELETE removes it (204) and the transaction is gone (404)', async () => {
    const { token } = await h.createSignedInUser()
    const created = await h.createTransaction(token)
    assert.equal((await h.api('DELETE', `/transactions/${created.id}`, { token })).status, 204)
    assert.equal((await h.api('GET', `/transactions/${created.id}`, { token })).status, 404)
    assert.equal((await h.api('DELETE', `/transactions/${created.id}`, { token })).status, 404)
  })
})

describe('isolation between users', () => {
  it("nobody reads, changes or deletes someone else's transaction (same 404 as not found)", async () => {
    const ana = await h.createSignedInUser()
    const bruno = await h.createSignedInUser()
    const anas = await h.createTransaction(ana.token)

    const attempts = [
      await h.api('GET', `/transactions/${anas.id}`, { token: bruno.token }),
      await h.api('PUT', `/transactions/${anas.id}`, { token: bruno.token, body: h.newTransaction({ description: 'break-in' }) }),
      await h.api('DELETE', `/transactions/${anas.id}`, { token: bruno.token }),
    ]
    for (const response of attempts) {
      assert.equal(response.status, 404)
      assert.deepEqual(response.body, { message: 'Transaction not found.' })
    }

    const untouched = await h.api('GET', `/transactions/${anas.id}`, { token: ana.token })
    assert.deepEqual(untouched.body, anas)
  })

  it("the list only has the user's own transactions", async () => {
    const ana = await h.createSignedInUser()
    const bruno = await h.createSignedInUser()
    await h.createTransaction(ana.token)
    const { body } = await h.api('GET', '/transactions', { token: bruno.token })
    assert.deepEqual(body.transactions, [])
    assert.equal(body.pagination.total, 0)
  })
})

describe('GET /transactions (filters, order and pagination)', () => {
  // Five transactions on different dates for all the cases below.
  async function setUp() {
    const { token } = await h.createSignedInUser()
    const c = h.categories
    const create = (data) => h.createTransaction(token, data)
    const t1 = await create({ description: 'Salary', amount: 500000, date: '2026-08-05', type: 'income', category_id: c.Salary })
    const t2 = await create({ description: 'Supermarket', amount: 12050, date: '2026-08-10', type: 'expense', category_id: c.Groceries })
    const t3 = await create({ description: 'Cinema', amount: 4000, date: '2026-09-15', type: 'expense', category_id: c.Leisure })
    const t4 = await create({ description: 'Market', amount: 8000, date: '2026-10-01', type: 'expense', category_id: c.Groceries })
    const t5 = await create({ description: 'Freelance', amount: 150000, date: '2026-10-02', type: 'income', category_id: c.Sales })
    return { token, t1, t2, t3, t4, t5 }
  }
  const ids = (body) => body.transactions.map((t) => t.id)

  it('sorts from newest to oldest and paginates', async () => {
    const { token, t1, t2, t3, t4, t5 } = await setUp()
    const all = await h.api('GET', '/transactions', { token })
    assert.deepEqual(ids(all.body), [t5.id, t4.id, t3.id, t2.id, t1.id])

    const page2 = await h.api('GET', '/transactions?limit=2&page=2', { token })
    assert.deepEqual(ids(page2.body), [t3.id, t2.id])
    assert.deepEqual(page2.body.pagination, { page: 2, limit: 2, total: 5, total_pages: 3 })
  })

  it('order=asc reverses the order', async () => {
    const { token, t1, t5 } = await setUp()
    const { body } = await h.api('GET', '/transactions?order=asc', { token })
    assert.equal(ids(body)[0], t1.id)
    assert.equal(ids(body).at(-1), t5.id)
  })

  it('filters by type', async () => {
    const { token, t1, t5 } = await setUp()
    const { body } = await h.api('GET', '/transactions?type=income', { token })
    assert.deepEqual(ids(body), [t5.id, t1.id])
  })

  it('filters by one or more categories (comma-separated or repeating the parameter)', async () => {
    const { token, t2, t3, t4 } = await setUp()
    const { Groceries, Leisure } = h.categories
    const withComma = await h.api('GET', `/transactions?category_id=${Groceries},${Leisure}`, { token })
    const repeated = await h.api('GET', `/transactions?category_id=${Groceries}&category_id=${Leisure}`, { token })
    assert.deepEqual(ids(withComma.body), [t4.id, t3.id, t2.id])
    assert.deepEqual(ids(repeated.body), [t4.id, t3.id, t2.id])
  })

  it('filters by period', async () => {
    const { token, t3 } = await setUp()
    const { body } = await h.api('GET', '/transactions?from=2026-09-01&to=2026-09-30', { token })
    assert.deepEqual(ids(body), [t3.id])
  })

  it('refuses a reversed period, a limit above 100 and an invalid type (400)', async () => {
    const { token } = await h.createSignedInUser()
    for (const query of ['from=2026-10-01&to=2026-09-01', 'limit=500', 'type=debit', 'category_id=abc']) {
      const { status } = await h.api('GET', `/transactions?${query}`, { token })
      assert.equal(status, 400, query)
    }
  })

  it('ignores unknown parameters such as the old ?filtro= without breaking (before: error 500)', async () => {
    const { token } = await setUp()
    const { status, body } = await h.api('GET', '/transactions?filtro=Mercado', { token })
    assert.equal(status, 200)
    assert.equal(body.pagination.total, 5)
  })
})
