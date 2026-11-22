const { describe, it, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const h = require('./helpers')

before(() => h.start())
after(() => h.stop())
beforeEach(() => h.resetDatabase())

async function setUp() {
  const { token } = await h.createSignedInUser()
  const c = h.categories
  const create = (data) => h.createTransaction(token, data)
  await create({ description: 'Salary', amount: 500000, date: '2026-08-05', type: 'income', category_id: c.Salary })
  await create({ description: 'Supermarket', amount: 12050, date: '2026-08-10', type: 'expense', category_id: c.Groceries })
  await create({ description: 'Cinema', amount: 4000, date: '2026-09-15', type: 'expense', category_id: c.Leisure })
  await create({ description: 'Market', amount: 8000, date: '2026-10-01', type: 'expense', category_id: c.Groceries })
  await create({ description: 'Freelance', amount: 150000, date: '2026-10-02', type: 'income', category_id: c.Sales })
  return token
}

describe('GET /transactions/statement', () => {
  it('with no transactions: everything is zero, always as a number', async () => {
    const { token } = await h.createSignedInUser()
    const { status, body } = await h.api('GET', '/transactions/statement', { token })
    assert.equal(status, 200)
    assert.deepEqual(body, {
      period: { from: null, to: null },
      income: 0,
      expenses: 0,
      balance: 0,
      by_category: [],
    })
  })

  it('adds up income and expenses as numbers (before: text), works out the balance and groups by category', async () => {
    const token = await setUp()
    const { body } = await h.api('GET', '/transactions/statement', { token })
    assert.equal(body.income, 650000)
    assert.equal(body.expenses, 24050)
    assert.equal(body.balance, 625950)
    assert.deepEqual(
      body.by_category.map(({ category_name, type, total, count }) => [category_name, type, total, count]),
      [
        ['Salary', 'income', 500000, 1],
        ['Sales', 'income', 150000, 1],
        ['Groceries', 'expense', 20050, 2],
        ['Leisure', 'expense', 4000, 1],
      ],
    )
  })

  it('respects the period', async () => {
    const token = await setUp()
    const { body } = await h.api('GET', '/transactions/statement?from=2026-10-01&to=2026-10-31', { token })
    assert.deepEqual(body.period, { from: '2026-10-01', to: '2026-10-31' })
    assert.equal(body.income, 150000)
    assert.equal(body.expenses, 8000)
    assert.equal(body.balance, 142000)
  })

  it("does not mix in other users' transactions", async () => {
    await setUp()
    const { token } = await h.createSignedInUser()
    const { body } = await h.api('GET', '/transactions/statement', { token })
    assert.equal(body.income, 0)
    assert.equal(body.expenses, 0)
  })
})

describe('GET /transactions/monthly-summary', () => {
  it('returns the 12 months of the year, with zero where there were no transactions', async () => {
    const token = await setUp()
    const { status, body } = await h.api('GET', '/transactions/monthly-summary?year=2026', { token })
    assert.equal(status, 200)
    assert.equal(body.year, 2026)
    assert.equal(body.months.length, 12)
    const byMonth = Object.fromEntries(body.months.map((m) => [m.month, m]))
    assert.deepEqual(byMonth['2026-08'], { month: '2026-08', income: 500000, expenses: 12050, balance: 487950 })
    assert.deepEqual(byMonth['2026-09'], { month: '2026-09', income: 0, expenses: 4000, balance: -4000 })
    assert.deepEqual(byMonth['2026-10'], { month: '2026-10', income: 150000, expenses: 8000, balance: 142000 })
    assert.deepEqual(byMonth['2026-01'], { month: '2026-01', income: 0, expenses: 0, balance: 0 })
  })

  it('invalid year: 400', async () => {
    const { token } = await h.createSignedInUser()
    const { status } = await h.api('GET', '/transactions/monthly-summary?year=abc', { token })
    assert.equal(status, 400)
  })
})
