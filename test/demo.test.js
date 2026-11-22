const { describe, it, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const h = require('./helpers')
const { transacoesDeExemplo } = require('../src/services/demo')

before(() => h.iniciar())
after(() => h.encerrar())
beforeEach(() => h.limparBanco())

describe('POST /demo', () => {
  it('cria uma conta de demonstração já logada, com transações de exemplo', async () => {
    const { status, corpo } = await h.api('POST', '/demo')
    assert.equal(status, 201)
    assert.equal(corpo.usuario.demo, true)
    assert.equal('senha' in corpo.usuario, false)
    assert.match(corpo.usuario.email, /^demo-[0-9a-f]{16}@financify\.invalid$/)
    assert.equal(corpo.expira_em_horas, 24)

    const lista = await h.api('GET', '/transacoes?limite=100', { token: corpo.token })
    assert.equal(lista.status, 200)
    // todas as transações de exemplo entraram (nenhuma categoria ficou de fora)
    assert.equal(lista.corpo.paginacao.total, transacoesDeExemplo().length)

    const extrato = await h.api('GET', '/transacoes/extrato', { token: corpo.token })
    assert.ok(extrato.corpo.entrada > 0)
    assert.ok(extrato.corpo.saida > 0)
  })

  it('cada visitante ganha uma conta separada', async () => {
    const a = await h.api('POST', '/demo')
    const b = await h.api('POST', '/demo')
    assert.notEqual(a.corpo.usuario.id, b.corpo.usuario.id)

    await h.api('POST', '/transacoes', { token: a.corpo.token, corpo: h.novaTransacao({ descricao: 'Só da conta A' }) })
    const listaB = await h.api('GET', '/transacoes?limite=100', { token: b.corpo.token })
    assert.equal(listaB.corpo.transacoes.some((t) => t.descricao === 'Só da conta A'), false)
  })

  it('apaga as contas de demonstração com mais de 24 horas, e só elas', async () => {
    const real = await h.criarUsuarioLogado()
    const antiga = await h.api('POST', '/demo')
    await h.pool.query(`UPDATE usuarios SET criado_em = now() - interval '25 hours' WHERE id = $1`, [antiga.corpo.usuario.id])
    await h.pool.query(`UPDATE usuarios SET criado_em = now() - interval '25 hours' WHERE id = $1`, [real.id])

    await h.api('POST', '/demo')

    const { rows } = await h.pool.query('SELECT id FROM usuarios WHERE id = ANY($1::int[])', [
      [antiga.corpo.usuario.id, real.id],
    ])
    assert.deepEqual(rows.map((r) => r.id), [real.id])
    const sobras = await h.pool.query('SELECT count(*)::int AS n FROM transacoes WHERE usuario_id = $1', [
      antiga.corpo.usuario.id,
    ])
    assert.equal(sobras.rows[0].n, 0)
  })

  it('não deixa trocar o e-mail nem a senha da conta de demonstração', async () => {
    const { corpo } = await h.api('POST', '/demo')
    const email = await h.api('PATCH', '/usuarios/me', { token: corpo.token, corpo: { email: 'alguem@teste.com' } })
    assert.equal(email.status, 403)
    const senha = await h.api('PUT', '/usuarios/me/senha', {
      token: corpo.token,
      corpo: { senha_atual: 'qualquer', nova_senha: 'nova-senha-123' },
    })
    assert.equal(senha.status, 403)

    // o nome pode mudar
    const nome = await h.api('PATCH', '/usuarios/me', { token: corpo.token, corpo: { nome: 'Visitante' } })
    assert.equal(nome.status, 200)
    assert.equal(nome.corpo.nome, 'Visitante')
  })

  it('bloqueia com 429 depois do limite por IP', async () => {
    const { servidor, base } = await h.subirApp({ maxContasDemo: 2 })
    try {
      assert.equal((await h.api('POST', '/demo', { baseUrl: base })).status, 201)
      assert.equal((await h.api('POST', '/demo', { baseUrl: base })).status, 201)
      const bloqueada = await h.api('POST', '/demo', { baseUrl: base })
      assert.equal(bloqueada.status, 429)
    } finally {
      await new Promise((resolve) => servidor.close(resolve))
    }
  })
})

describe('transacoesDeExemplo', () => {
  it('nunca cria transações no futuro e cobre os últimos 4 meses', () => {
    const hoje = new Date('2026-03-02T12:00:00Z')
    const lista = transacoesDeExemplo(hoje)
    assert.ok(lista.every((t) => t.data <= '2026-03-02'))
    assert.deepEqual([...new Set(lista.map((t) => t.data.slice(0, 7)))], ['2025-12', '2026-01', '2026-02', '2026-03'])
    assert.ok(lista.every((t) => Number.isInteger(t.valor) && t.valor > 0))
  })
})
