const { describe, it, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const h = require('./helpers')
const { sampleTransactions } = require('../src/services/demo')

before(() => h.start())
after(() => h.stop())
beforeEach(() => h.resetDatabase())

describe('POST /demo', () => {
  it('creates a demo account, already signed in, with sample transactions', async () => {
    const { status, body } = await h.api('POST', '/demo')
    assert.equal(status, 201)
    assert.equal(body.user.demo, true)
    assert.equal('password' in body.user, false)
    assert.match(body.user.email, /^demo-[0-9a-f]{16}@financify\.invalid$/)
    assert.equal(body.expires_in_hours, 24)

    const list = await h.api('GET', '/transactions?limit=100', { token: body.token })
    assert.equal(list.status, 200)
    // every sample transaction went in (no category was left out)
    assert.equal(list.body.pagination.total, sampleTransactions().length)

    const statement = await h.api('GET', '/transactions/statement', { token: body.token })
    assert.ok(statement.body.income > 0)
    assert.ok(statement.body.expenses > 0)
  })

  it('each visitor gets a separate account', async () => {
    const a = await h.api('POST', '/demo')
    const b = await h.api('POST', '/demo')
    assert.notEqual(a.body.user.id, b.body.user.id)

    await h.api('POST', '/transactions', { token: a.body.token, body: h.newTransaction({ description: 'Only in account A' }) })
    const listB = await h.api('GET', '/transactions?limit=100', { token: b.body.token })
    assert.equal(listB.body.transactions.some((t) => t.description === 'Only in account A'), false)
  })

  it('deletes demo accounts older than 24 hours, and only those', async () => {
    const real = await h.createSignedInUser()
    const old = await h.api('POST', '/demo')
    await h.pool.query(`UPDATE users SET created_at = now() - interval '25 hours' WHERE id = $1`, [old.body.user.id])
    await h.pool.query(`UPDATE users SET created_at = now() - interval '25 hours' WHERE id = $1`, [real.id])

    await h.api('POST', '/demo')

    const { rows } = await h.pool.query('SELECT id FROM users WHERE id = ANY($1::int[])', [[old.body.user.id, real.id]])
    assert.deepEqual(rows.map((r) => r.id), [real.id])
    const leftovers = await h.pool.query('SELECT count(*)::int AS n FROM transactions WHERE user_id = $1', [old.body.user.id])
    assert.equal(leftovers.rows[0].n, 0)
  })

  it('does not let a demo account change its e-mail or password', async () => {
    const { body } = await h.api('POST', '/demo')
    const email = await h.api('PATCH', '/users/me', { token: body.token, body: { email: 'someone@test.com' } })
    assert.equal(email.status, 403)
    const password = await h.api('PUT', '/users/me/password', {
      token: body.token,
      body: { current_password: 'anything', new_password: 'new-password-123' },
    })
    assert.equal(password.status, 403)

    // the name can change
    const name = await h.api('PATCH', '/users/me', { token: body.token, body: { name: 'Visitor' } })
    assert.equal(name.status, 200)
    assert.equal(name.body.name, 'Visitor')
  })

  it('blocks with 429 after the per-IP limit', async () => {
    const { server, baseUrl } = await h.startApp({ maxDemoAccounts: 2 })
    try {
      assert.equal((await h.api('POST', '/demo', { base: baseUrl })).status, 201)
      assert.equal((await h.api('POST', '/demo', { base: baseUrl })).status, 201)
      const blocked = await h.api('POST', '/demo', { base: baseUrl })
      assert.equal(blocked.status, 429)
    } finally {
      await new Promise((resolve) => server.close(resolve))
    }
  })
})

describe('sampleTransactions', () => {
  it('never creates transactions in the future and covers the last 4 months', () => {
    const today = new Date('2026-03-02T12:00:00Z')
    const list = sampleTransactions(today)
    assert.ok(list.every((t) => t.date <= '2026-03-02'))
    assert.deepEqual([...new Set(list.map((t) => t.date.slice(0, 7)))], ['2025-12', '2026-01', '2026-02', '2026-03'])
    assert.ok(list.every((t) => Number.isInteger(t.amount) && t.amount > 0))
  })
})
