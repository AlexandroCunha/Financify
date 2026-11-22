const http = require('node:http')

let config
try {
  config = require('./config/env')
} catch (error) {
  console.error(error.message) // e.g. missing .env or JWT_SECRET too short
  process.exit(1)
}

const pool = require('./db/pool')
const { prepareDatabase, explainDatabaseError } = require('./db/migrate')
const { createApp } = require('./app')

async function start() {
  try {
    await prepareDatabase(pool, config.databaseUrl, { log: (message) => console.log(`[db] ${message}`) })
  } catch (error) {
    console.error(`[db] ${explainDatabaseError(error)}`)
    process.exit(1)
  }

  const server = http.createServer(createApp())

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${config.port} is already in use. Stop the other process or change PORT in .env.`)
    } else {
      console.error(error)
    }
    process.exit(1)
  })

  server.listen(config.port, () => {
    console.log(`Financify API running at http://localhost:${config.port}`)
    console.log(`Docs: http://localhost:${config.port}/docs`)
  })

  // Clean shutdown (Ctrl+C, deploys, node --watch restarts).
  const shutdown = (signal) => {
    console.log(`\n${signal} received, shutting down...`)
    server.close(() => pool.end().finally(() => process.exit(0)))
    setTimeout(() => process.exit(1), 10_000).unref()
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}

start()
