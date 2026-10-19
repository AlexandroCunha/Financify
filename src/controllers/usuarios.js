const servico = require('../services/usuarios')
const esquemas = require('../validations/usuarios')
const { validar } = require('../validations/validador')
const { requisicaoInvalida } = require('../utils/erros')

async function cadastrar(req, res) {
  const dados = validar(esquemas.cadastro, req.body)
  res.status(201).json(await servico.cadastrar(dados))
}

function detalhar(req, res) {
  res.json(req.usuario)
}

async function atualizar(req, res) {
  const dados = validar(esquemas.atualizacao, req.body)
  if (Object.keys(dados).length === 0) {
    throw requisicaoInvalida(undefined, 'Informe ao menos um campo para atualizar: nome ou email.')
  }
  res.json(await servico.atualizarPerfil(req.usuario.id, dados))
}

async function alterarSenha(req, res) {
  const dados = validar(esquemas.trocaDeSenha, req.body)
  await servico.alterarSenha(req.usuario.id, dados)
  res.status(204).end()
}

async function excluir(req, res) {
  await servico.excluirConta(req.usuario.id)
  res.status(204).end()
}

module.exports = { cadastrar, detalhar, atualizar, alterarSenha, excluir }
