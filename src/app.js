const express = require('express')
const config = require('./config/env')
const pool = require('./db/pool')
const createRoutes = require('./routes')
const docs = require('./docs')
const requestLogger = require('./middlewares/requestLogger')
const { securityHeaders, cors } = require('./middlewares/security')
const { notFound, handleErrors } = require('./middlewares/errors')
const { version } = require('../package.json')

// Builds the app without opening a port (server.js does that), so tests can start their own instances.
function createApp({
  maxLoginAttempts = config.loginMaxAttempts,
  maxDemoAccounts = config.demoMaxPerIp,
  logRequests = config.environment !== 'test',
} = {}) {
  const app = express()
  app.disable('x-powered-by')
  if (config.trustProxy !== undefined) app.set('trust proxy', config.trustProxy)

  if (logRequests) app.use(requestLogger)
  app.use(securityHeaders)
  app.use(cors(config.corsOrigins))
  app.use(express.json({ limit: '100kb' }))

  app.get('/', (req, res) => {
    res.json({ name: 'Financify API', version, docs: '/docs' })
  })

  app.get('/health', async (req, res) => {
    try {
      await pool.query('SELECT 1')
      res.json({ status: 'ok' })
    } catch {
      res.status(503).json({ status: 'error', message: 'Database unavailable.' })
    }
  })

  app.use('/docs', docs)
  app.use(createRoutes({ maxLoginAttempts, maxDemoAccounts }))

  app.use(notFound)
  app.use(handleErrors)
  return app
}

module.exports = { createApp }
