const { describe, it, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const h = require('./helpers')

before(() => h.iniciar())
after(() => h.encerrar())
beforeEach(() => h.limparBanco())

describe('POST /usuarios', () => {
  it('cadastra, normaliza nome e e-mail e não devolve a senha', async () => {
    const { status, corpo } = await h.api('POST', '/usuarios', {
      corpo: { nome: '  Ana Souza  ', email: ' Ana@Email.com ', senha: 'senha-segura-123' },
    })
    assert.equal(status, 201)
    assert.equal(corpo.nome, 'Ana Souza')
    assert.equal(corpo.email, 'ana@email.com')
    assert.equal('senha' in corpo, false)

    const { rows } = await h.pool.query('SELECT senha FROM usuarios WHERE id = $1', [corpo.id])
    assert.notEqual(rows[0].senha, 'senha-segura-123', 'a senha deve ser guardada como hash')
  })

  it('recusa e-mail já cadastrado, mesmo com letras maiúsculas (409)', async () => {
    await h.criarUsuarioLogado({ email: 'ana@email.com' })
    const { status, corpo } = await h.api('POST', '/usuarios', {
      corpo: { nome: 'Outra Ana', email: 'ANA@EMAIL.COM', senha: 'senha-segura-123' },
    })
    assert.equal(status, 409)
    assert.deepEqual(corpo, { mensagem: 'Já existe uma conta com este e-mail.' })
  })

  it('valida nome, e-mail e tamanho da senha (400 com erro por campo)', async () => {
    const { status, corpo } = await h.api('POST', '/usuarios', {
      corpo: { nome: '   ', email: 'nao-e-email', senha: '1' },
    })
    assert.equal(status, 400)
    assert.deepEqual(corpo.erros, {
      nome: 'não pode ficar vazio',
      email: 'deve ser um e-mail válido',
      senha: 'deve ter pelo menos 8 caracteres',
    })
  })

  it('aceita requisição sem corpo e responde 400 com os campos obrigatórios', async () => {
    const { status, corpo } = await h.api('POST', '/usuarios')
    assert.equal(status, 400)
    assert.deepEqual(Object.keys(corpo.erros).sort(), ['email', 'nome', 'senha'])
  })

  it('ignora campos que não fazem parte do cadastro', async () => {
    const { status, corpo } = await h.api('POST', '/usuarios', {
      corpo: { id: 999, nome: 'Ana', email: 'ana@email.com', senha: 'senha-segura-123', admin: true },
    })
    assert.equal(status, 201)
    assert.notEqual(corpo.id, 999)
    assert.equal('admin' in corpo, false)
  })
})

describe('/usuarios/me', () => {
  it('GET devolve o usuário logado', async () => {
    const usuario = await h.criarUsuarioLogado()
    const { status, corpo } = await h.api('GET', '/usuarios/me', { token: usuario.token })
    assert.equal(status, 200)
    assert.deepEqual(Object.keys(corpo).sort(), ['criado_em', 'email', 'id', 'nome'])
    assert.equal(corpo.id, usuario.id)
  })

  it('PATCH altera só o nome, sem exigir a senha', async () => {
    const usuario = await h.criarUsuarioLogado()
    const { status, corpo } = await h.api('PATCH', '/usuarios/me', { token: usuario.token, corpo: { nome: 'Novo Nome' } })
    assert.equal(status, 200)
    assert.equal(corpo.nome, 'Novo Nome')
    assert.equal(corpo.email, usuario.email)
  })

  it('PATCH recusa e-mail de outra conta (409)', async () => {
    const ana = await h.criarUsuarioLogado()
    const bruno = await h.criarUsuarioLogado()
    const { status } = await h.api('PATCH', '/usuarios/me', { token: bruno.token, corpo: { email: ana.email } })
    assert.equal(status, 409)
  })

  it('PATCH sem nenhum campo válido: 400', async () => {
    const { token } = await h.criarUsuarioLogado()
    const { status, corpo } = await h.api('PATCH', '/usuarios/me', { token, corpo: { senha: 'nao-se-troca-aqui' } })
    assert.equal(status, 400)
    assert.match(corpo.mensagem, /Informe ao menos um campo/)
  })

  it('PUT /usuarios/me/senha troca a senha só com a senha atual correta', async () => {
    const usuario = await h.criarUsuarioLogado()

    const errada = await h.api('PUT', '/usuarios/me/senha', {
      token: usuario.token,
      corpo: { senha_atual: 'nao-e-essa', nova_senha: 'nova-senha-456' },
    })
    assert.equal(errada.status, 400)
    assert.deepEqual(errada.corpo.erros, { senha_atual: 'está incorreta' })

    const certa = await h.api('PUT', '/usuarios/me/senha', {
      token: usuario.token,
      corpo: { senha_atual: usuario.senha, nova_senha: 'nova-senha-456' },
    })
    assert.equal(certa.status, 204)

    const comNova = await h.api('POST', '/login', { corpo: { email: usuario.email, senha: 'nova-senha-456' } })
    const comAntiga = await h.api('POST', '/login', { corpo: { email: usuario.email, senha: usuario.senha } })
    assert.equal(comNova.status, 200)
    assert.equal(comAntiga.status, 401)
  })

  it('DELETE exclui a conta e as transações; o token deixa de valer', async () => {
    const usuario = await h.criarUsuarioLogado()
    await h.criarTransacao(usuario.token)

    const exclusao = await h.api('DELETE', '/usuarios/me', { token: usuario.token })
    assert.equal(exclusao.status, 204)

    const depois = await h.api('GET', '/usuarios/me', { token: usuario.token })
    assert.equal(depois.status, 401)
    const { rows } = await h.pool.query('SELECT count(*) AS total FROM transacoes')
    assert.equal(rows[0].total, 0)
  })
})
