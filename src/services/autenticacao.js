const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const config = require('../config/env')
const usuarios = require('../repositories/usuarios')
const { naoAutorizado } = require('../utils/erros')

// Quando o e-mail não existe, comparamos a senha com um hash qualquer. Assim o tempo de resposta
// fica parecido nos dois casos e não revela quais e-mails têm conta.
const HASH_FICTICIO = bcrypt.hashSync('financify-hash-ficticio', 10)

function gerarToken(usuarioId) {
  return jwt.sign({}, config.jwt.segredo, {
    subject: String(usuarioId),
    expiresIn: config.jwt.expiraEm,
    algorithm: 'HS256',
  })
}

async function login({ email, senha }) {
  const usuario = await usuarios.buscarComSenhaPorEmail(email)
  const senhaConfere = await bcrypt.compare(senha, usuario?.senha ?? HASH_FICTICIO)
  if (!usuario || !senhaConfere) throw naoAutorizado('E-mail ou senha inválidos.')

  const { senha: _hash, ...dadosPublicos } = usuario
  return { usuario: dadosPublicos, token: gerarToken(usuario.id) }
}

async function usuarioDoToken(token) {
  let payload
  try {
    payload = jwt.verify(token, config.jwt.segredo, { algorithms: ['HS256'] })
  } catch (erro) {
    throw naoAutorizado(
      erro.name === 'TokenExpiredError' ? 'Token expirado. Faça login novamente.' : 'Token inválido.',
    )
  }

  const id = Number(payload.sub)
  if (!Number.isInteger(id) || id < 1) throw naoAutorizado('Token inválido.')

  const usuario = await usuarios.buscarPorId(id)
  if (!usuario) throw naoAutorizado('Token inválido.') // ex.: a conta foi excluída
  return usuario
}

module.exports = { login, usuarioDoToken, gerarToken }
