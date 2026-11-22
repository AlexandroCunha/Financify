const { describe, it, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const h = require('./helpers')

before(() => h.start())
after(() => h.stop())
beforeEach(() => h.resetDatabase())

describe('standard error responses', () => {
  it('malformed JSON: 400 as JSON, with no stack trace', async () => {
    const { status, body, headers } = await h.api('POST', '/login', { body: '{bad' })
    assert.equal(status, 400)
    assert.match(headers.get('content-type'), /application\/json/)
    assert.deepEqual(body, { message: 'The request body is not valid JSON.' })
  })

  it('unknown route: 404 as JSON, with or without a token', async () => {
    const { token } = await h.createSignedInUser()
    for (const options of [{}, { token }]) {
      const { status, body } = await h.api('GET', '/does-not-exist', options)
      assert.equal(status, 404)
      assert.deepEqual(body, { message: 'Route not found: GET /does-not-exist' })
    }
  })
})

describe('system', () => {
  it('GET / identifies the API', async () => {
    const { status, body } = await h.api('GET', '/')
    assert.equal(status, 200)
    assert.equal(body.name, 'Financify API')
    assert.equal(body.docs, '/docs')
  })

  it('GET /health confirms the database answers', async () => {
    const { status, body } = await h.api('GET', '/health')
    assert.equal(status, 200)
    assert.deepEqual(body, { status: 'ok' })
  })

  it('sends security headers and hides X-Powered-By', async () => {
    const { headers } = await h.api('GET', '/')
    assert.equal(headers.get('x-content-type-options'), 'nosniff')
    assert.equal(headers.get('x-frame-options'), 'DENY')
    assert.equal(headers.get('x-powered-by'), null)
  })

  it('CORS: allows the configured origin, answers the preflight and ignores other origins', async () => {
    const preflight = await h.api('OPTIONS', '/transactions', {
      headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST' },
    })
    assert.equal(preflight.status, 204)
    assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://localhost:5173')
    assert.match(preflight.headers.get('access-control-allow-headers'), /Authorization/)

    const otherOrigin = await h.api('GET', '/', { headers: { Origin: 'https://strange-site.com' } })
    assert.equal(otherOrigin.headers.get('access-control-allow-origin'), null)
  })
})

describe('docs', () => {
  it('GET /docs serves Swagger UI', async () => {
    const { status, body, headers } = await h.api('GET', '/docs')
    assert.equal(status, 200)
    assert.match(headers.get('content-type'), /text\/html/)
    assert.match(body, /swagger-ui/)
  })

  it('every documented route exists in the API', async () => {
    const { body: spec } = await h.api('GET', '/docs/openapi.json')
    assert.equal(spec.openapi, '3.1.0')
    for (const [route, operations] of Object.entries(spec.paths)) {
      for (const method of Object.keys(operations).filter((key) => key !== 'parameters')) {
        const { token } = await h.createSignedInUser() // a new account for each call (one of them deletes the account)
        const url = route.replace('{id}', '999999')
        const { status } = await h.api(method.toUpperCase(), url, { token, body: method === 'get' ? undefined : {} })
        // 404 is only fine when the route exists and the resource is what was not found.
        const resourceNotFound = route.includes('{id}') && status === 404
        assert.ok(status !== 404 || resourceNotFound, `${method.toUpperCase()} ${route} does not exist in the API`)
      }
    }
  })
})
