const { describe, it, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const h = require('./helpers')

before(() => h.iniciar())
after(() => h.encerrar())
beforeEach(() => h.limparBanco())

async function prepararCenario() {
  const { token } = await h.criarUsuarioLogado()
  const c = h.categorias
  const criar = (dados) => h.criarTransacao(token, dados)
  await criar({ descricao: 'Salário', valor: 500000, data: '2026-08-05', tipo: 'entrada', categoria_id: c['Salário'] })
  await criar({ descricao: 'Mercado', valor: 12050, data: '2026-08-10', tipo: 'saida', categoria_id: c.Mercado })
  await criar({ descricao: 'Cinema', valor: 4000, data: '2026-09-15', tipo: 'saida', categoria_id: c.Lazer })
  await criar({ descricao: 'Feira', valor: 8000, data: '2026-10-01', tipo: 'saida', categoria_id: c.Mercado })
  await criar({ descricao: 'Freela', valor: 150000, data: '2026-10-02', tipo: 'entrada', categoria_id: c.Vendas })
  return token
}

describe('GET /transacoes/extrato', () => {
  it('sem transações: tudo zero, sempre como número', async () => {
    const { token } = await h.criarUsuarioLogado()
    const { status, corpo } = await h.api('GET', '/transacoes/extrato', { token })
    assert.equal(status, 200)
    assert.deepEqual(corpo, {
      periodo: { de: null, ate: null },
      entrada: 0,
      saida: 0,
      saldo: 0,
      por_categoria: [],
    })
  })

  it('soma entradas e saídas como números (antes: texto), calcula o saldo e agrupa por categoria', async () => {
    const token = await prepararCenario()
    const { corpo } = await h.api('GET', '/transacoes/extrato', { token })
    assert.equal(corpo.entrada, 650000)
    assert.equal(corpo.saida, 24050)
    assert.equal(corpo.saldo, 625950)
    assert.deepEqual(
      corpo.por_categoria.map(({ categoria_nome, tipo, total, quantidade }) => [categoria_nome, tipo, total, quantidade]),
      [
        ['Salário', 'entrada', 500000, 1],
        ['Vendas', 'entrada', 150000, 1],
        ['Mercado', 'saida', 20050, 2],
        ['Lazer', 'saida', 4000, 1],
      ],
    )
  })

  it('respeita o período', async () => {
    const token = await prepararCenario()
    const { corpo } = await h.api('GET', '/transacoes/extrato?de=2026-10-01&ate=2026-10-31', { token })
    assert.deepEqual(corpo.periodo, { de: '2026-10-01', ate: '2026-10-31' })
    assert.equal(corpo.entrada, 150000)
    assert.equal(corpo.saida, 8000)
    assert.equal(corpo.saldo, 142000)
  })

  it('não mistura transações de outros usuários', async () => {
    await prepararCenario()
    const { token } = await h.criarUsuarioLogado()
    const { corpo } = await h.api('GET', '/transacoes/extrato', { token })
    assert.equal(corpo.entrada, 0)
    assert.equal(corpo.saida, 0)
  })
})

describe('GET /transacoes/resumo-mensal', () => {
  it('devolve os 12 meses do ano, com zero onde não houve transações', async () => {
    const token = await prepararCenario()
    const { status, corpo } = await h.api('GET', '/transacoes/resumo-mensal?ano=2026', { token })
    assert.equal(status, 200)
    assert.equal(corpo.ano, 2026)
    assert.equal(corpo.meses.length, 12)
    const porMes = Object.fromEntries(corpo.meses.map((m) => [m.mes, m]))
    assert.deepEqual(porMes['2026-08'], { mes: '2026-08', entrada: 500000, saida: 12050, saldo: 487950 })
    assert.deepEqual(porMes['2026-09'], { mes: '2026-09', entrada: 0, saida: 4000, saldo: -4000 })
    assert.deepEqual(porMes['2026-10'], { mes: '2026-10', entrada: 150000, saida: 8000, saldo: 142000 })
    assert.deepEqual(porMes['2026-01'], { mes: '2026-01', entrada: 0, saida: 0, saldo: 0 })
  })

  it('ano inválido: 400', async () => {
    const { token } = await h.criarUsuarioLogado()
    const { status } = await h.api('GET', '/transacoes/resumo-mensal?ano=abc', { token })
    assert.equal(status, 400)
  })
})
