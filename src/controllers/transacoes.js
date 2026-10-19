const servico = require('../services/transacoes')
const esquemas = require('../validations/transacoes')
const { validar } = require('../validations/validador')
const { requisicaoInvalida } = require('../utils/erros')

function conferirPeriodo({ de, ate }) {
  if (de && ate && de > ate) throw requisicaoInvalida({ ate: 'deve ser igual ou posterior à data "de"' })
}

async function listar(req, res) {
  const filtros = validar(esquemas.filtrosDaListagem, req.query)
  conferirPeriodo(filtros)
  res.json(await servico.listar(req.usuario.id, filtros))
}

async function detalhar(req, res) {
  const { id } = validar(esquemas.parametroId, req.params)
  res.json(await servico.detalhar(req.usuario.id, id))
}

async function cadastrar(req, res) {
  const dados = validar(esquemas.transacao, req.body)
  res.status(201).json(await servico.cadastrar(req.usuario.id, dados))
}

async function atualizar(req, res) {
  const { id } = validar(esquemas.parametroId, req.params)
  const dados = validar(esquemas.transacao, req.body)
  res.json(await servico.atualizar(req.usuario.id, id, dados))
}

async function excluir(req, res) {
  const { id } = validar(esquemas.parametroId, req.params)
  await servico.excluir(req.usuario.id, id)
  res.status(204).end()
}

async function extrato(req, res) {
  const periodo = validar(esquemas.periodo, req.query)
  conferirPeriodo(periodo)
  res.json(await servico.extrato(req.usuario.id, periodo))
}

async function resumoMensal(req, res) {
  const { ano = new Date().getFullYear() } = validar(esquemas.resumoMensal, req.query)
  res.json(await servico.resumoMensal(req.usuario.id, ano))
}

module.exports = { listar, detalhar, cadastrar, atualizar, excluir, extrato, resumoMensal }
