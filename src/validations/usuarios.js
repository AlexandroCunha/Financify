const { esquema, texto, email, senha } = require('./validador')

const cadastro = esquema({
  nome: texto({ max: 100 }),
  email: email(),
  senha: senha(),
})

const login = esquema({
  email: email(),
  senha: texto({ max: 72, aparar: false }),
})

const atualizacao = esquema(
  {
    nome: texto({ max: 100 }),
    email: email(),
  },
  { parcial: true },
)

const trocaDeSenha = esquema({
  senha_atual: texto({ max: 72, aparar: false }),
  nova_senha: senha(),
})

module.exports = { cadastro, login, atualizacao, trocaDeSenha }
