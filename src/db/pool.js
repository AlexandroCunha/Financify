const { Pool, types } = require('pg')
const config = require('../config/env')

// DATE comes back as 'YYYY-MM-DD' text. Otherwise the driver builds a Date at midnight in the
// server's time zone and, once turned into JSON, the date can show up a day early in other time zones.
types.setTypeParser(types.builtins.DATE, (value) => value)

// BIGINT (the result of SUM and COUNT) comes back as a number instead of text.
// Safe here: the totals stay far below Number.MAX_SAFE_INTEGER.
types.setTypeParser(types.builtins.INT8, (value) => Number(value))

const pool = new Pool({ connectionString: config.databaseUrl })

// Keeps the app running if an idle connection drops (e.g. the database restarted).
pool.on('error', (error) => {
  console.error('[db] error on an idle connection:', error.message)
})

module.exports = pool
