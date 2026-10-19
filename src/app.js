const express = require('express')
const config = require('./config/env')
const pool = require('./db/pool')
const criarRotas = require('./routes')
const docs = require('./docs')
const registrarRequisicoes = require('./middlewares/registrarRequisicoes')
const { cabecalhosDeSeguranca, cors } = require('./middlewares/seguranca')
const { rotaNaoEncontrada, tratarErros } = require('./middlewares/erros')
const { version } = require('../package.json')

// Monta o app sem abrir porta (o server.js faz isso). Assim os testes sobem instâncias próprias.
function criarApp({
  maxTentativasLogin = config.loginMaxTentativas,
  registrarLog = config.ambiente !== 'test',
} = {}) {
  const app = express()
  app.disable('x-powered-by')
  if (config.trustProxy !== undefined) app.set('trust proxy', config.trustProxy)

  if (registrarLog) app.use(registrarRequisicoes)
  app.use(cabecalhosDeSeguranca)
  app.use(cors(config.corsOrigens))
  app.use(express.json({ limit: '100kb' }))

  app.get('/', (req, res) => {
    res.json({ nome: 'Financify API', versao: version, documentacao: '/docs' })
  })

  app.get('/health', async (req, res) => {
    try {
      await pool.query('SELECT 1')
      res.json({ status: 'ok' })
    } catch {
      res.status(503).json({ status: 'erro', mensagem: 'Banco de dados indisponível.' })
    }
  })

  app.use('/docs', docs)
  app.use(criarRotas({ maxTentativasLogin }))

  app.use(rotaNaoEncontrada)
  app.use(tratarErros)
  return app
}

module.exports = { criarApp }
