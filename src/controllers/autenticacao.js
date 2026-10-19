const servico = require('../services/autenticacao')
const esquemas = require('../validations/usuarios')
const { validar } = require('../validations/validador')

async function login(req, res) {
  const credenciais = validar(esquemas.login, req.body)
  res.json(await servico.login(credenciais))
}

module.exports = { login }
