const express = require('express')
const { cadastrarUsuario, login, detalharUsuario, atualizarUsuario, deletarTransacao } = require('../controllers/usuarios')
const { transacoesDoUsuario, detalharTransacao, cadastrarTransacao, atualizarTransacao } = require('../controllers/transacoes')
const { listarCategorias } = require('../controllers/categorias')
const validarLogin = require('../middleware/validarlogin')
const validarParaAtualizarUsuario = require('../middleware/validarAtualizarUsuario')
const validarParaCadastrarUsuario = require('../middleware/validarCadastrarUsuario')
const validarTransacaoParaUsuarioLogado = require('../middleware/ValidarSeExisteTransacaoParaUsuarioLogado')
const validarParaAtualizarTransacao = require('../middleware/validarAtualizarTransacao')



const rotas = express()

rotas.post('/usuario', cadastrarUsuario)
rotas.post('/login', login)

rotas.use(validarLogin)

rotas.get('/usuario', detalharUsuario)
rotas.put('/usuarios', validarParaAtualizarUsuario, atualizarUsuario)
rotas.get('/categoria', listarCategorias)
rotas.get('/transacao', transacoesDoUsuario)
rotas.get('/transacao/:id', validarTransacaoParaUsuarioLogado, detalharTransacao)
rotas.post('/transacao', validarParaCadastrarUsuario, cadastrarTransacao)
rotas.put('/transacao/:id', validarParaAtualizarTransacao, atualizarTransacao)
rotas.delete('/transacao/:id', validarTransacaoParaUsuarioLogado, deletarTransacao)


module.exports = rotas