const { Router } = require('express')
const autenticar = require('../middlewares/autenticar')
const limitarTentativas = require('../middlewares/limitarTentativas')
const autenticacao = require('../controllers/autenticacao')
const demo = require('../controllers/demo')
const usuarios = require('../controllers/usuarios')
const categorias = require('../controllers/categorias')
const transacoes = require('../controllers/transacoes')

function criarRotas({ maxTentativasLogin, maxContasDemo }) {
  const rotas = Router()

  // Públicas
  const limiteDeLogin =
    maxTentativasLogin > 0
      ? [limitarTentativas({ maximo: maxTentativasLogin, mensagem: 'Muitas tentativas de login. Tente novamente em alguns minutos.' })]
      : []
  rotas.post('/login', ...limiteDeLogin, autenticacao.login)
  rotas.post('/usuarios', usuarios.cadastrar)

  // Conta de demonstração com dados de exemplo (uma por visitante, apagada em 24 horas)
  const limiteDeDemo =
    maxContasDemo > 0
      ? [limitarTentativas({ maximo: maxContasDemo, mensagem: 'Muitas contas de demonstração criadas. Tente novamente em alguns minutos.' })]
      : []
  rotas.post('/demo', ...limiteDeDemo, demo.criar)

  // Conta do usuário logado
  rotas.get('/usuarios/me', autenticar, usuarios.detalhar)
  rotas.patch('/usuarios/me', autenticar, usuarios.atualizar)
  rotas.put('/usuarios/me/senha', autenticar, usuarios.alterarSenha)
  rotas.delete('/usuarios/me', autenticar, usuarios.excluir)

  // Categorias e transações (todas exigem login)
  rotas.get('/categorias', autenticar, categorias.listar)

  const rotasDeTransacoes = Router()
  rotasDeTransacoes.use(autenticar)
  rotasDeTransacoes.get('/', transacoes.listar)
  rotasDeTransacoes.get('/extrato', transacoes.extrato)
  rotasDeTransacoes.get('/resumo-mensal', transacoes.resumoMensal)
  rotasDeTransacoes.get('/:id', transacoes.detalhar)
  rotasDeTransacoes.post('/', transacoes.cadastrar)
  rotasDeTransacoes.put('/:id', transacoes.atualizar)
  rotasDeTransacoes.delete('/:id', transacoes.excluir)
  rotas.use('/transacoes', rotasDeTransacoes)

  return rotas
}

module.exports = criarRotas
