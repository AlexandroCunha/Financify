const { describe, it, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const jwt = require('jsonwebtoken')
const h = require('./helpers')

before(() => h.iniciar())
after(() => h.encerrar())
beforeEach(() => h.limparBanco())

describe('POST /login', () => {
  it('devolve o token e os dados do usuário, sem a senha', async () => {
    const { email, senha } = await h.criarUsuarioLogado()
    const { status, corpo } = await h.api('POST', '/login', { corpo: { email, senha } })
    assert.equal(status, 200)
    assert.match(corpo.token, /^[\w-]+\.[\w-]+\.[\w-]+$/)
    assert.equal(corpo.usuario.email, email)
    assert.equal('senha' in corpo.usuario, false)
  })

  it('aceita o e-mail com maiúsculas e espaços', async () => {
    const { email, senha } = await h.criarUsuarioLogado()
    const { status } = await h.api('POST', '/login', { corpo: { email: `  ${email.toUpperCase()} `, senha } })
    assert.equal(status, 200)
  })

  it('responde igual para e-mail inexistente e senha errada (não revela quem tem conta)', async () => {
    const { email } = await h.criarUsuarioLogado()
    const senhaErrada = await h.api('POST', '/login', { corpo: { email, senha: 'senha-errada-123' } })
    const emailInexistente = await h.api('POST', '/login', {
      corpo: { email: 'ninguem@teste.com', senha: 'senha-errada-123' },
    })
    assert.equal(senhaErrada.status, 401)
    assert.equal(emailInexistente.status, 401)
    assert.deepEqual(senhaErrada.corpo, { mensagem: 'E-mail ou senha inválidos.' })
    assert.deepEqual(emailInexistente.corpo, senhaErrada.corpo)
  })

  it('exige e-mail e senha (400, não 404)', async () => {
    const { status, corpo } = await h.api('POST', '/login', { corpo: {} })
    assert.equal(status, 400)
    assert.deepEqual(Object.keys(corpo.erros).sort(), ['email', 'senha'])
  })

  it('bloqueia com 429 depois do limite de tentativas', async () => {
    const { servidor, base } = await h.subirApp({ maxTentativasLogin: 3 })
    try {
      const tentar = () =>
        h.api('POST', '/login', { baseUrl: base, corpo: { email: 'alguem@teste.com', senha: 'qualquer-coisa' } })
      for (let i = 0; i < 3; i += 1) assert.equal((await tentar()).status, 401)
      const bloqueada = await tentar()
      assert.equal(bloqueada.status, 429)
      assert.ok(Number(bloqueada.cabecalhos.get('retry-after')) > 0)
    } finally {
      await new Promise((resolve) => servidor.close(resolve))
    }
  })
})

describe('rotas protegidas', () => {
  it('sem token: 401 com { mensagem }', async () => {
    const { status, corpo } = await h.api('GET', '/usuarios/me')
    assert.equal(status, 401)
    assert.match(corpo.mensagem, /Token de autenticação não informado/)
  })

  it('token malformado: 401 "Token inválido."', async () => {
    const { status, corpo } = await h.api('GET', '/usuarios/me', { token: 'abc.def.ghi' })
    assert.equal(status, 401)
    assert.deepEqual(corpo, { mensagem: 'Token inválido.' })
  })

  it('recusa token assinado com a chave antiga que estava no repositório', async () => {
    const usuario = await h.criarUsuarioLogado()
    const forjado = jwt.sign({ id: usuario.id }, 'mysecretkey', { subject: String(usuario.id) })
    const { status } = await h.api('GET', '/usuarios/me', { token: forjado })
    assert.equal(status, 401)
  })

  it('token expirado: 401 pedindo novo login', async () => {
    const usuario = await h.criarUsuarioLogado()
    const expirado = jwt.sign(
      { sub: String(usuario.id), exp: Math.floor(Date.now() / 1000) - 10 },
      process.env.JWT_SECRET,
    )
    const { status, corpo } = await h.api('GET', '/usuarios/me', { token: expirado })
    assert.equal(status, 401)
    assert.deepEqual(corpo, { mensagem: 'Token expirado. Faça login novamente.' })
  })

  it('aceita o esquema "bearer" em minúsculas', async () => {
    const { token } = await h.criarUsuarioLogado()
    const { status } = await h.api('GET', '/usuarios/me', { cabecalhos: { Authorization: `bearer ${token}` } })
    assert.equal(status, 200)
  })
})
