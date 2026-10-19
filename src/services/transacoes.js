const transacoes = require('../repositories/transacoes')
const { naoEncontrado, requisicaoInvalida } = require('../utils/erros')

const LIMITE_PADRAO = 20
const NAO_ENCONTRADA = 'Transação não encontrada.'

// Se a categoria não existir, o banco recusa pela chave estrangeira; aqui viramos isso em 400.
async function comCategoriaValidada(operacao) {
  try {
    return await operacao()
  } catch (erro) {
    if (erro.code === '23503' && erro.constraint === 'transacoes_categoria_id_fkey') {
      throw requisicaoInvalida({ categoria_id: 'categoria não encontrada' })
    }
    throw erro
  }
}

async function listar(usuarioId, { pagina = 1, limite = LIMITE_PADRAO, ordem = 'desc', categoria_id, ...filtros }) {
  const { transacoes: itens, total } = await transacoes.listar(
    usuarioId,
    { ...filtros, categorias: categoria_id },
    { limite, deslocamento: (pagina - 1) * limite, ordem },
  )
  return {
    transacoes: itens,
    paginacao: { pagina, limite, total, total_paginas: Math.ceil(total / limite) },
  }
}

async function detalhar(usuarioId, id) {
  const transacao = await transacoes.buscar(usuarioId, id)
  if (!transacao) throw naoEncontrado(NAO_ENCONTRADA)
  return transacao
}

function cadastrar(usuarioId, dados) {
  return comCategoriaValidada(() => transacoes.criar(usuarioId, dados))
}

async function atualizar(usuarioId, id, dados) {
  const transacao = await comCategoriaValidada(() => transacoes.atualizar(usuarioId, id, dados))
  if (!transacao) throw naoEncontrado(NAO_ENCONTRADA)
  return transacao
}

async function excluir(usuarioId, id) {
  const excluida = await transacoes.excluir(usuarioId, id)
  if (!excluida) throw naoEncontrado(NAO_ENCONTRADA)
}

async function extrato(usuarioId, { de, ate }) {
  const periodo = { de, ate }
  const [{ entrada, saida }, porCategoria] = await Promise.all([
    transacoes.totais(usuarioId, periodo),
    transacoes.totaisPorCategoria(usuarioId, periodo),
  ])
  return {
    periodo: { de: de ?? null, ate: ate ?? null },
    entrada,
    saida,
    saldo: entrada - saida,
    por_categoria: porCategoria,
  }
}

// Sempre devolve os 12 meses do ano (com zero onde não houve transações), pronto para gráficos.
async function resumoMensal(usuarioId, ano) {
  const linhas = await transacoes.totaisPorMes(usuarioId, ano)
  const porMes = new Map(linhas.map((linha) => [linha.mes, linha]))
  const meses = Array.from({ length: 12 }, (_, indice) => {
    const mes = `${ano}-${String(indice + 1).padStart(2, '0')}`
    const { entrada = 0, saida = 0 } = porMes.get(mes) ?? {}
    return { mes, entrada, saida, saldo: entrada - saida }
  })
  return { ano, meses }
}

module.exports = { listar, detalhar, cadastrar, atualizar, excluir, extrato, resumoMensal }
