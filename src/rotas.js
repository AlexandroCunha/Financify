const express = require('express')
const { cadastrarUsuario, login } = require('./controladores/usuarios')
const verificarLogin = require('./intermediarios/verificarLogin')


const rotas = express()

rotas.post('/usuario', cadastrarUsuario)
rotas.post('/login', login)

rotas.use(verificarLogin)


module.exports = rotas