// Test helpers: an isolated test database and the API running on a random port.
const assert = require('node:assert/strict')
const http = require('node:http')
const { once } = require('node:events')
const path = require('node:path')

// Settings applied before the app loads (.env does not override variables that are already set).
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'secret-used-only-in-the-tests-0123456789'
process.env.CORS_ORIGIN = 'http://localhost:5173'
process.env.LOGIN_MAX_ATTEMPTS = '0'
process.env.DEMO_MAX_PER_IP = '0'
try {
  process.loadEnvFile(path.resolve(__dirname, '../.env'))
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
process.env.DATABASE_URL = testDatabaseUrl()

// By default uses the same server as DATABASE_URL, in a database with "_test" in its name.
function testDatabaseUrl() {
  if (process.env.DATABASE_URL_TEST) return process.env.DATABASE_URL_TEST
  if (!process.env.DATABASE_URL) {
    throw new Error('Set DATABASE_URL (or DATABASE_URL_TEST) in .env to run the tests.')
  }
  const url = new URL(process.env.DATABASE_URL)
  url.pathname = `${url.pathname}_test`
  return url.toString()
}

const { createApp } = require('../src/app')
const pool = require('../src/db/pool')
const { prepareDatabase } = require('../src/db/migrate')

let server
let baseUrl
const categories = {}

async function startApp(options) {
  const instance = http.createServer(createApp(options)).listen(0, '127.0.0.1')
  await once(instance, 'listening')
  return { server: instance, baseUrl: `http://127.0.0.1:${instance.address().port}` }
}

async function start() {
  await prepareDatabase(pool, process.env.DATABASE_URL, { log: () => {} })
  const { rows } = await pool.query('SELECT id, name FROM categories')
  for (const { id, name } of rows) categories[name] = id
  const app = await startApp()
  server = app.server
  baseUrl = app.baseUrl
}

async function stop() {
  await new Promise((resolve) => server.close(resolve))
  await pool.end()
}

async function resetDatabase() {
  await pool.query('TRUNCATE users RESTART IDENTITY CASCADE')
}

async function api(method, route, { token, body, headers = {}, base = baseUrl } = {}) {
  const allHeaders = { ...headers }
  if (body !== undefined) allHeaders['Content-Type'] = 'application/json'
  if (token) allHeaders.Authorization = `Bearer ${token}`
  const response = await fetch(base + route, {
    method,
    headers: allHeaders,
    body: body === undefined || typeof body === 'string' ? body : JSON.stringify(body),
  })
  const text = await response.text()
  let data = text || null
  try {
    data = JSON.parse(text)
  } catch {}
  return { status: response.status, body: data, headers: response.headers }
}

let sequence = 0
async function createSignedInUser(data = {}) {
  sequence += 1
  const user = {
    name: `Person ${sequence}`,
    email: `person${sequence}@test.com`,
    password: 'safe-password-123',
    ...data,
  }
  const signUp = await api('POST', '/users', { body: user })
  assert.equal(signUp.status, 201, JSON.stringify(signUp.body))
  const login = await api('POST', '/login', { body: { email: user.email, password: user.password } })
  assert.equal(login.status, 200, JSON.stringify(login.body))
  return { ...signUp.body, password: user.password, token: login.body.token }
}

function newTransaction(data = {}) {
  return {
    description: 'Supermarket shop',
    amount: 1000,
    date: '2026-10-10',
    category_id: categories.Groceries,
    type: 'expense',
    ...data,
  }
}

async function createTransaction(token, data) {
  const response = await api('POST', '/transactions', { token, body: newTransaction(data) })
  assert.equal(response.status, 201, JSON.stringify(response.body))
  return response.body
}

module.exports = {
  start,
  stop,
  resetDatabase,
  startApp,
  api,
  createSignedInUser,
  newTransaction,
  createTransaction,
  categories,
  pool,
}
