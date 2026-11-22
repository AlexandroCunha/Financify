const { describe, it, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const jwt = require('jsonwebtoken')
const h = require('./helpers')

before(() => h.start())
after(() => h.stop())
beforeEach(() => h.resetDatabase())

describe('POST /login', () => {
  it('returns the token and the user data, without the password', async () => {
    const { email, password } = await h.createSignedInUser()
    const { status, body } = await h.api('POST', '/login', { body: { email, password } })
    assert.equal(status, 200)
    assert.match(body.token, /^[\w-]+\.[\w-]+\.[\w-]+$/)
    assert.equal(body.user.email, email)
    assert.equal('password' in body.user, false)
  })

  it('accepts the e-mail with capitals and spaces', async () => {
    const { email, password } = await h.createSignedInUser()
    const { status } = await h.api('POST', '/login', { body: { email: `  ${email.toUpperCase()} `, password } })
    assert.equal(status, 200)
  })

  it('answers the same for an unknown e-mail and a wrong password (does not reveal who has an account)', async () => {
    const { email } = await h.createSignedInUser()
    const wrongPassword = await h.api('POST', '/login', { body: { email, password: 'wrong-password-123' } })
    const unknownEmail = await h.api('POST', '/login', {
      body: { email: 'nobody@test.com', password: 'wrong-password-123' },
    })
    assert.equal(wrongPassword.status, 401)
    assert.equal(unknownEmail.status, 401)
    assert.deepEqual(wrongPassword.body, { message: 'Invalid e-mail or password.' })
    assert.deepEqual(unknownEmail.body, wrongPassword.body)
  })

  it('requires e-mail and password (400, not 404)', async () => {
    const { status, body } = await h.api('POST', '/login', { body: {} })
    assert.equal(status, 400)
    assert.deepEqual(Object.keys(body.errors).sort(), ['email', 'password'])
  })

  it('blocks with 429 after the attempt limit', async () => {
    const { server, baseUrl } = await h.startApp({ maxLoginAttempts: 3 })
    try {
      const attempt = () =>
        h.api('POST', '/login', { base: baseUrl, body: { email: 'someone@test.com', password: 'anything-at-all' } })
      for (let i = 0; i < 3; i += 1) assert.equal((await attempt()).status, 401)
      const blocked = await attempt()
      assert.equal(blocked.status, 429)
      assert.ok(Number(blocked.headers.get('retry-after')) > 0)
    } finally {
      await new Promise((resolve) => server.close(resolve))
    }
  })
})

describe('protected routes', () => {
  it('no token: 401 with { message }', async () => {
    const { status, body } = await h.api('GET', '/users/me')
    assert.equal(status, 401)
    assert.match(body.message, /Missing authentication token/)
  })

  it('malformed token: 401 "Invalid token."', async () => {
    const { status, body } = await h.api('GET', '/users/me', { token: 'abc.def.ghi' })
    assert.equal(status, 401)
    assert.deepEqual(body, { message: 'Invalid token.' })
  })

  it('refuses a token signed with the old key that used to be in the repository', async () => {
    const user = await h.createSignedInUser()
    const forged = jwt.sign({ id: user.id }, 'mysecretkey', { subject: String(user.id) })
    const { status } = await h.api('GET', '/users/me', { token: forged })
    assert.equal(status, 401)
  })

  it('expired token: 401 asking to sign in again', async () => {
    const user = await h.createSignedInUser()
    const expired = jwt.sign({ sub: String(user.id), exp: Math.floor(Date.now() / 1000) - 10 }, process.env.JWT_SECRET)
    const { status, body } = await h.api('GET', '/users/me', { token: expired })
    assert.equal(status, 401)
    assert.deepEqual(body, { message: 'Token expired. Please sign in again.' })
  })

  it('accepts the "bearer" scheme in lowercase', async () => {
    const { token } = await h.createSignedInUser()
    const { status } = await h.api('GET', '/users/me', { headers: { Authorization: `bearer ${token}` } })
    assert.equal(status, 200)
  })
})
