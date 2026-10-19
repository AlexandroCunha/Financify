const categorias = require('../repositories/categorias')

async function listar(req, res) {
  res.json(await categorias.listar())
}

module.exports = { listar }
