const http = require('node:http')

let config
try {
  config = require('./config/env')
} catch (erro) {
  console.error(erro.message) // ex.: .env faltando ou JWT_SECRET curto demais
  process.exit(1)
}

const pool = require('./db/pool')
const { prepararBanco, explicarErroDoBanco } = require('./db/migrar')
const { criarApp } = require('./app')

async function iniciar() {
  try {
    await prepararBanco(pool, config.databaseUrl, { log: (mensagem) => console.log(`[banco] ${mensagem}`) })
  } catch (erro) {
    console.error(`[banco] ${explicarErroDoBanco(erro)}`)
    process.exit(1)
  }

  const servidor = http.createServer(criarApp())

  servidor.on('error', (erro) => {
    if (erro.code === 'EADDRINUSE') {
      console.error(`A porta ${config.porta} já está em uso. Feche o outro processo ou mude PORT no .env.`)
    } else {
      console.error(erro)
    }
    process.exit(1)
  })

  servidor.listen(config.porta, () => {
    console.log(`Financify API rodando em http://localhost:${config.porta}`)
    console.log(`Documentação: http://localhost:${config.porta}/docs`)
  })

  // Encerramento limpo (Ctrl+C, deploy, reinício do node --watch).
  const encerrar = (sinal) => {
    console.log(`\n${sinal} recebido, encerrando...`)
    servidor.close(() => pool.end().finally(() => process.exit(0)))
    setTimeout(() => process.exit(1), 10_000).unref()
  }
  process.once('SIGINT', encerrar)
  process.once('SIGTERM', encerrar)
}

iniciar()
