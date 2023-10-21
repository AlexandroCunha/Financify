const express = require('express')
const { cadastrarUsuario, login, detalharUsuario, atualizarUsuario } = require('../controllers/usuarios')
const validarLogin = require('../middleware/validarlogin')
const { listarCategorias } = require('../controllers/categorias')
const validarDadosParaAtualizarUsuario = require('../middleware/validarDadosParaAtualizarUsuario')
const { transacoesDoUsuario, detalharTransacao, cadastrarTransacao, atualizarTransacao } = require('../controllers/transacoes')
const validarDadosParaCadastrarUsuario = require('../middleware/validarDadosParaCadastrarUsuario')
const validarTransacaoDoUsuario = require('../middleware/validarDadosParaDetalharTransacao')
const validarDadosParaAtualizarTransacao = require('../middleware/validarDadosParaAtualizarTransacao')



const rotas = express()

rotas.post('/usuario', cadastrarUsuario)
rotas.post('/login', login)

rotas.use(validarLogin)

rotas.get('/usuario', detalharUsuario)
rotas.put('/usuarios', validarDadosParaAtualizarUsuario, atualizarUsuario)
rotas.get('/categoria', listarCategorias)
rotas.get('/transacao', transacoesDoUsuario)
rotas.get('/transacao/:id', validarTransacaoDoUsuario, detalharTransacao)
rotas.post('/transacao', validarDadosParaCadastrarUsuario, cadastrarTransacao)
rotas.put('/transacao/:id', validarDadosParaAtualizarTransacao, atualizarTransacao)


module.exports = rotas