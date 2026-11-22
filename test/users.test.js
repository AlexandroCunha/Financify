const { describe, it, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const h = require('./helpers')

before(() => h.start())
after(() => h.stop())
beforeEach(() => h.resetDatabase())

describe('POST /users', () => {
  it('signs up, normalises name and e-mail and does not return the password', async () => {
    const { status, body } = await h.api('POST', '/users', {
      body: { name: '  Ana Souza  ', email: ' Ana@Email.com ', password: 'safe-password-123' },
    })
    assert.equal(status, 201)
    assert.equal(body.name, 'Ana Souza')
    assert.equal(body.email, 'ana@email.com')
    assert.equal('password' in body, false)

    const { rows } = await h.pool.query('SELECT password FROM users WHERE id = $1', [body.id])
    assert.notEqual(rows[0].password, 'safe-password-123', 'the password must be stored as a hash')
  })

  it('refuses an e-mail that is already registered, even in capitals (409)', async () => {
    await h.createSignedInUser({ email: 'ana@email.com' })
    const { status, body } = await h.api('POST', '/users', {
      body: { name: 'Another Ana', email: 'ANA@EMAIL.COM', password: 'safe-password-123' },
    })
    assert.equal(status, 409)
    assert.deepEqual(body, { message: 'An account with this e-mail already exists.' })
  })

  it('validates name, e-mail and password length (400 with an error per field)', async () => {
    const { status, body } = await h.api('POST', '/users', {
      body: { name: '   ', email: 'not-an-email', password: '1' },
    })
    assert.equal(status, 400)
    assert.deepEqual(body.errors, {
      name: 'cannot be empty',
      email: 'must be a valid e-mail',
      password: 'must be at least 8 characters long',
    })
  })

  it('accepts a request with no body and answers 400 with the required fields', async () => {
    const { status, body } = await h.api('POST', '/users')
    assert.equal(status, 400)
    assert.deepEqual(Object.keys(body.errors).sort(), ['email', 'name', 'password'])
  })

  it('ignores fields that are not part of the sign-up', async () => {
    const { status, body } = await h.api('POST', '/users', {
      body: { id: 999, name: 'Ana', email: 'ana@email.com', password: 'safe-password-123', admin: true },
    })
    assert.equal(status, 201)
    assert.notEqual(body.id, 999)
    assert.equal('admin' in body, false)
  })
})

describe('/users/me', () => {
  it('GET returns the signed-in user', async () => {
    const user = await h.createSignedInUser()
    const { status, body } = await h.api('GET', '/users/me', { token: user.token })
    assert.equal(status, 200)
    assert.deepEqual(Object.keys(body).sort(), ['created_at', 'demo', 'email', 'id', 'name'])
    assert.equal(body.demo, false)
    assert.equal(body.id, user.id)
  })

  it('PATCH changes only the name, without asking for the password', async () => {
    const user = await h.createSignedInUser()
    const { status, body } = await h.api('PATCH', '/users/me', { token: user.token, body: { name: 'New Name' } })
    assert.equal(status, 200)
    assert.equal(body.name, 'New Name')
    assert.equal(body.email, user.email)
  })

  it("PATCH refuses another account's e-mail (409)", async () => {
    const ana = await h.createSignedInUser()
    const bruno = await h.createSignedInUser()
    const { status } = await h.api('PATCH', '/users/me', { token: bruno.token, body: { email: ana.email } })
    assert.equal(status, 409)
  })

  it('PATCH with no valid field: 400', async () => {
    const { token } = await h.createSignedInUser()
    const { status, body } = await h.api('PATCH', '/users/me', { token, body: { password: 'not-changed-here' } })
    assert.equal(status, 400)
    assert.match(body.message, /Send at least one field/)
  })

  it('PUT /users/me/password changes the password only with the right current password', async () => {
    const user = await h.createSignedInUser()

    const wrong = await h.api('PUT', '/users/me/password', {
      token: user.token,
      body: { current_password: 'not-this-one', new_password: 'new-password-456' },
    })
    assert.equal(wrong.status, 400)
    assert.deepEqual(wrong.body.errors, { current_password: 'is incorrect' })

    const right = await h.api('PUT', '/users/me/password', {
      token: user.token,
      body: { current_password: user.password, new_password: 'new-password-456' },
    })
    assert.equal(right.status, 204)

    const withNew = await h.api('POST', '/login', { body: { email: user.email, password: 'new-password-456' } })
    const withOld = await h.api('POST', '/login', { body: { email: user.email, password: user.password } })
    assert.equal(withNew.status, 200)
    assert.equal(withOld.status, 401)
  })

  it('DELETE removes the account and its transactions; the token stops working', async () => {
    const user = await h.createSignedInUser()
    await h.createTransaction(user.token)

    const deletion = await h.api('DELETE', '/users/me', { token: user.token })
    assert.equal(deletion.status, 204)

    const after = await h.api('GET', '/users/me', { token: user.token })
    assert.equal(after.status, 401)
    const { rows } = await h.pool.query('SELECT count(*) AS total FROM transactions')
    assert.equal(rows[0].total, 0)
  })
})
