const express = require('express')
const rotas = require('../routes/router')

const app = express()

app.use(express.json())

app.use(rotas)

app.listen(3000)