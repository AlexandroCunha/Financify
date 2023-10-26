const express = require('express')

const validarLogin = require('../middleware/validarlogin')
const { listarCategorias } = require('../controllers/categorias')
const { cadastrarUsuario, login, detalharUsuario, atualizarUsuario } = require('../controllers/usuarios')
const { transacoesDoUsuario, detalharTransacao, cadastrarTransacao, atualizarTransacao, deletarTransacao, obterExtrato } = require('../controllers/transacoes')
const { validarDadosParaTransacoes, validarDadosParaAtualizarTransacao, validarDadosParaCadastrarTransacao } = require('../middleware/validarTransacoes')
const { validarDadosParaAtualizarUsuario, validarDadosParaLogin, validarDadosParaCadastrarUsuario } = require('../middleware/validarUsuario')

const rotas = express()

rotas.post('/usuario', validarDadosParaCadastrarUsuario, cadastrarUsuario)
rotas.post('/login', validarDadosParaLogin, login)

rotas.use(validarLogin)

rotas.get('/categoria', listarCategorias)

rotas.get('/usuario', detalharUsuario)
rotas.put('/usuarios', validarDadosParaAtualizarUsuario, atualizarUsuario)

rotas.get('/transacao', transacoesDoUsuario)
rotas.get('/transacao/extrato', obterExtrato)
rotas.get('/transacao/:id', validarDadosParaTransacoes, detalharTransacao)
rotas.delete('/transacao/:id', validarDadosParaTransacoes, deletarTransacao)
rotas.post('/transacao', validarDadosParaCadastrarTransacao, cadastrarTransacao)
rotas.put('/transacao/:id', validarDadosParaAtualizarTransacao, atualizarTransacao)


module.exports = rotas