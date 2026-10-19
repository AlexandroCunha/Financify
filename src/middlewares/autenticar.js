const { usuarioDoToken } = require('../services/autenticacao')
const { naoAutorizado } = require('../utils/erros')

// Exige o header "Authorization: Bearer <token>" e coloca o usuário em req.usuario.
async function autenticar(req, res, next) {
  const [esquema, token] = (req.get('authorization') ?? '').trim().split(/\s+/)
  if (esquema?.toLowerCase() !== 'bearer' || !token) {
    throw naoAutorizado('Token de autenticação não informado. Envie o header Authorization: Bearer <token>.')
  }
  req.usuario = await usuarioDoToken(token)
  next()
}

module.exports = autenticar
