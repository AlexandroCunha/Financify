const pool = require('../db/pool')

async function listar() {
  const { rows } = await pool.query('SELECT id, descricao FROM categorias ORDER BY id')
  return rows
}

module.exports = { listar }
