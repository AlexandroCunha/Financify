const express = require('express')
const { cadastrarUsuario, login, detalharUsuario, atualizarUsuario, deletarTransacao } = require('../controllers/usuarios')
const { transacoesDoUsuario, detalharTransacao, cadastrarTransacao, atualizarTransacao } = require('../controllers/transacoes')
const { listarCategorias } = require('../controllers/categorias')
const validarLogin = require('../middleware/validarlogin')
const validarAtualizarUsuario = require('../middleware/validarAtualizarUsuario')
const validarCadastrarUsuario = require('../middleware/validarCadastrarUsuario')
const validarTransacaoParaUsuarioLogado = require('../middleware/ValidarSeExisteTransacaoParaUsuarioLogado')
const validarAtualizarTransacao = require('../middleware/validarAtualizarTransacao')



const rotas = express()

rotas.post('/usuario', cadastrarUsuario)
rotas.post('/login', login)

rotas.use(validarLogin)

rotas.get('/usuario', detalharUsuario)
rotas.put('/usuarios', validarAtualizarUsuario, atualizarUsuario)
rotas.get('/categoria', listarCategorias)
rotas.get('/transacao', transacoesDoUsuario)
rotas.get('/transacao/:id', validarTransacaoParaUsuarioLogado, detalharTransacao)
rotas.post('/transacao', validarCadastrarUsuario, cadastrarTransacao)
rotas.put('/transacao/:id', validarAtualizarTransacao, atualizarTransacao)
rotas.delete('/transacao/:id', validarTransacaoParaUsuarioLogado, deletarTransacao)


module.exports = rotas