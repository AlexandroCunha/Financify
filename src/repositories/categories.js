const pool = require('../db/pool')

async function list() {
  const { rows } = await pool.query('SELECT id, name FROM categories ORDER BY id')
  return rows
}

module.exports = { list }
