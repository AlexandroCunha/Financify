const servico = require('../services/demo')

async function criar(req, res) {
  res.status(201).json(await servico.criarContaDemo())
}

module.exports = { criar }
