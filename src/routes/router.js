const express = require('express')
const { cadastrarUsuario, login } = require('../controllers/usuarios')
const verificarLogin = require('../middleware/verificarLogin')


const rotas = express()

rotas.post('/usuario', cadastrarUsuario)
rotas.post('/login', login)

rotas.use(verificarLogin)


module.exports = rotas