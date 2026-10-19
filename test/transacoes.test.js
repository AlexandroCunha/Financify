// Fuso bem distante de UTC: as datas não podem mudar (na versão antiga elas "voltavam" um dia).
process.env.TZ = 'Pacific/Kiritimati'

const { describe, it, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const h = require('./helpers')

before(() => h.iniciar())
after(() => h.encerrar())
beforeEach(() => h.limparBanco())

describe('POST /transacoes', () => {
  it('cadastra e devolve a transação com o nome da categoria e a data exata', async () => {
    const { token } = await h.criarUsuarioLogado()
    const dados = h.novaTransacao({ descricao: 'Salário', valor: 500000, data: '2026-10-01', tipo: 'entrada', categoria_id: h.categorias['Salário'] })
    const { status, corpo } = await h.api('POST', '/transacoes', { token, corpo: dados })
    assert.equal(status, 201)
    assert.equal(corpo.data, '2026-10-01')
    assert.equal(corpo.valor, 500000)
    assert.equal(corpo.categoria_nome, 'Salário')
    assert.equal('usuario_id' in corpo, false)
  })

  const invalidos = [
    ['valor negativo', 'valor', -999],
    ['valor zero', 'valor', 0],
    ['valor decimal', 'valor', 10.5],
    ['valor em texto', 'valor', 'abc'],
    ['data em outro formato', 'data', '01/10/2026'],
    ['data que não existe', 'data', '2026-02-30'],
    ['data por extenso', 'data', 'ontem'],
    ['tipo desconhecido', 'tipo', 'debito'],
    ['categoria em texto', 'categoria_id', 'abc'],
    ['descrição em branco', 'descricao', '   '],
  ]
  for (const [caso, campo, valor] of invalidos) {
    it(`recusa ${caso} com 400 (antes: aceito ou erro 500)`, async () => {
      const { token } = await h.criarUsuarioLogado()
      const { status, corpo } = await h.api('POST', '/transacoes', { token, corpo: h.novaTransacao({ [campo]: valor }) })
      assert.equal(status, 400)
      assert.ok(corpo.erros?.[campo], `esperava erro no campo ${campo}: ${JSON.stringify(corpo)}`)
    })
  }

  it('recusa categoria inexistente (400)', async () => {
    const { token } = await h.criarUsuarioLogado()
    const { status, corpo } = await h.api('POST', '/transacoes', { token, corpo: h.novaTransacao({ categoria_id: 9999 }) })
    assert.equal(status, 400)
    assert.deepEqual(corpo.erros, { categoria_id: 'categoria não encontrada' })
  })
})

describe('GET /transacoes/:id', () => {
  it('devolve um objeto (antes: uma lista com um item)', async () => {
    const { token } = await h.criarUsuarioLogado()
    const criada = await h.criarTransacao(token)
    const { status, corpo } = await h.api('GET', `/transacoes/${criada.id}`, { token })
    assert.equal(status, 200)
    assert.deepEqual(corpo, criada)
  })

  it('id que não é número ou grande demais: 400 (antes: 500)', async () => {
    const { token } = await h.criarUsuarioLogado()
    for (const id of ['abc', '1.5', '99999999999']) {
      const { status } = await h.api('GET', `/transacoes/${id}`, { token })
      assert.equal(status, 400, `id ${id}`)
    }
  })

  it('inexistente: 404', async () => {
    const { token } = await h.criarUsuarioLogado()
    const { status, corpo } = await h.api('GET', '/transacoes/12345', { token })
    assert.equal(status, 404)
    assert.deepEqual(corpo, { mensagem: 'Transação não encontrada.' })
  })
})

describe('PUT e DELETE /transacoes/:id', () => {
  it('PUT atualiza e devolve a transação', async () => {
    const { token } = await h.criarUsuarioLogado()
    const criada = await h.criarTransacao(token)
    const novosDados = h.novaTransacao({ descricao: 'Cinema', valor: 4500, data: '2026-10-12', categoria_id: h.categorias.Lazer })
    const { status, corpo } = await h.api('PUT', `/transacoes/${criada.id}`, { token, corpo: novosDados })
    assert.equal(status, 200)
    assert.equal(corpo.descricao, 'Cinema')
    assert.equal(corpo.valor, 4500)
    assert.equal(corpo.categoria_nome, 'Lazer')
    assert.ok(new Date(corpo.atualizado_em) >= new Date(criada.atualizado_em))
  })

  it('PUT valida os dados (400)', async () => {
    const { token } = await h.criarUsuarioLogado()
    const criada = await h.criarTransacao(token)
    const { status, corpo } = await h.api('PUT', `/transacoes/${criada.id}`, { token, corpo: { valor: -1 } })
    assert.equal(status, 400)
    assert.ok(corpo.erros.valor)
    assert.ok(corpo.erros.descricao)
  })

  it('DELETE exclui (204) e a transação deixa de existir (404)', async () => {
    const { token } = await h.criarUsuarioLogado()
    const criada = await h.criarTransacao(token)
    assert.equal((await h.api('DELETE', `/transacoes/${criada.id}`, { token })).status, 204)
    assert.equal((await h.api('GET', `/transacoes/${criada.id}`, { token })).status, 404)
    assert.equal((await h.api('DELETE', `/transacoes/${criada.id}`, { token })).status, 404)
  })
})

describe('isolamento entre usuários', () => {
  it('ninguém lê, altera ou exclui transação de outra pessoa (mesmo 404 de inexistente)', async () => {
    const ana = await h.criarUsuarioLogado()
    const bruno = await h.criarUsuarioLogado()
    const daAna = await h.criarTransacao(ana.token)

    const tentativas = [
      await h.api('GET', `/transacoes/${daAna.id}`, { token: bruno.token }),
      await h.api('PUT', `/transacoes/${daAna.id}`, { token: bruno.token, corpo: h.novaTransacao({ descricao: 'invasão' }) }),
      await h.api('DELETE', `/transacoes/${daAna.id}`, { token: bruno.token }),
    ]
    for (const resposta of tentativas) {
      assert.equal(resposta.status, 404)
      assert.deepEqual(resposta.corpo, { mensagem: 'Transação não encontrada.' })
    }

    const intacta = await h.api('GET', `/transacoes/${daAna.id}`, { token: ana.token })
    assert.deepEqual(intacta.corpo, daAna)
  })

  it('a listagem só traz as transações do próprio usuário', async () => {
    const ana = await h.criarUsuarioLogado()
    const bruno = await h.criarUsuarioLogado()
    await h.criarTransacao(ana.token)
    const { corpo } = await h.api('GET', '/transacoes', { token: bruno.token })
    assert.deepEqual(corpo.transacoes, [])
    assert.equal(corpo.paginacao.total, 0)
  })
})

describe('GET /transacoes (filtros, ordem e paginação)', () => {
  // Cinco transações em datas diferentes para todos os cenários abaixo.
  async function prepararCenario() {
    const { token } = await h.criarUsuarioLogado()
    const c = h.categorias
    const criar = (dados) => h.criarTransacao(token, dados)
    const t1 = await criar({ descricao: 'Salário', valor: 500000, data: '2026-08-05', tipo: 'entrada', categoria_id: c['Salário'] })
    const t2 = await criar({ descricao: 'Mercado', valor: 12050, data: '2026-08-10', tipo: 'saida', categoria_id: c.Mercado })
    const t3 = await criar({ descricao: 'Cinema', valor: 4000, data: '2026-09-15', tipo: 'saida', categoria_id: c.Lazer })
    const t4 = await criar({ descricao: 'Feira', valor: 8000, data: '2026-10-01', tipo: 'saida', categoria_id: c.Mercado })
    const t5 = await criar({ descricao: 'Freela', valor: 150000, data: '2026-10-02', tipo: 'entrada', categoria_id: c.Vendas })
    return { token, t1, t2, t3, t4, t5 }
  }
  const ids = (corpo) => corpo.transacoes.map((t) => t.id)

  it('ordena da mais recente para a mais antiga e pagina', async () => {
    const { token, t1, t2, t3, t4, t5 } = await prepararCenario()
    const tudo = await h.api('GET', '/transacoes', { token })
    assert.deepEqual(ids(tudo.corpo), [t5.id, t4.id, t3.id, t2.id, t1.id])

    const pagina2 = await h.api('GET', '/transacoes?limite=2&pagina=2', { token })
    assert.deepEqual(ids(pagina2.corpo), [t3.id, t2.id])
    assert.deepEqual(pagina2.corpo.paginacao, { pagina: 2, limite: 2, total: 5, total_paginas: 3 })
  })

  it('ordem=asc inverte a ordem', async () => {
    const { token, t1, t5 } = await prepararCenario()
    const { corpo } = await h.api('GET', '/transacoes?ordem=asc', { token })
    assert.equal(ids(corpo)[0], t1.id)
    assert.equal(ids(corpo).at(-1), t5.id)
  })

  it('filtra por tipo', async () => {
    const { token, t1, t5 } = await prepararCenario()
    const { corpo } = await h.api('GET', '/transacoes?tipo=entrada', { token })
    assert.deepEqual(ids(corpo), [t5.id, t1.id])
  })

  it('filtra por uma ou mais categorias (separadas por vírgula ou repetindo o parâmetro)', async () => {
    const { token, t2, t3, t4 } = await prepararCenario()
    const { Mercado, Lazer } = h.categorias
    const comVirgula = await h.api('GET', `/transacoes?categoria_id=${Mercado},${Lazer}`, { token })
    const repetido = await h.api('GET', `/transacoes?categoria_id=${Mercado}&categoria_id=${Lazer}`, { token })
    assert.deepEqual(ids(comVirgula.corpo), [t4.id, t3.id, t2.id])
    assert.deepEqual(ids(repetido.corpo), [t4.id, t3.id, t2.id])
  })

  it('filtra por período', async () => {
    const { token, t3 } = await prepararCenario()
    const { corpo } = await h.api('GET', '/transacoes?de=2026-09-01&ate=2026-09-30', { token })
    assert.deepEqual(ids(corpo), [t3.id])
  })

  it('recusa período invertido, limite acima de 100 e tipo inválido (400)', async () => {
    const { token } = await h.criarUsuarioLogado()
    for (const consulta of ['de=2026-10-01&ate=2026-09-01', 'limite=500', 'tipo=debito', 'categoria_id=abc']) {
      const { status } = await h.api('GET', `/transacoes?${consulta}`, { token })
      assert.equal(status, 400, consulta)
    }
  })

  it('ignora o parâmetro antigo ?filtro= sem quebrar (antes: erro 500)', async () => {
    const { token } = await prepararCenario()
    const { status, corpo } = await h.api('GET', '/transacoes?filtro=Mercado', { token })
    assert.equal(status, 200)
    assert.equal(corpo.paginacao.total, 5)
  })
})
