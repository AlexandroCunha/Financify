const fs = require('node:fs/promises')
const path = require('node:path')
const { Client } = require('pg')

const PASTA_MIGRACOES = path.join(__dirname, 'migrations')
const CHAVE_DA_TRAVA = 4815162342 // evita que dois processos apliquem migrações ao mesmo tempo

// Aplica, em ordem, os arquivos .sql de src/db/migrations que ainda não foram aplicados.
async function migrar(pool, { log = console.log } = {}) {
  const cliente = await pool.connect()
  try {
    await cliente.query('SELECT pg_advisory_lock($1::bigint)', [CHAVE_DA_TRAVA])
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS migracoes (
        nome        TEXT PRIMARY KEY,
        aplicada_em TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)
    const { rows } = await cliente.query('SELECT nome FROM migracoes')
    const aplicadas = new Set(rows.map((linha) => linha.nome))
    const arquivos = (await fs.readdir(PASTA_MIGRACOES)).filter((nome) => nome.endsWith('.sql')).sort()

    let novas = 0
    for (const arquivo of arquivos) {
      if (aplicadas.has(arquivo)) continue
      const sql = await fs.readFile(path.join(PASTA_MIGRACOES, arquivo), 'utf8')
      try {
        await cliente.query('BEGIN')
        await cliente.query(sql)
        await cliente.query('INSERT INTO migracoes (nome) VALUES ($1)', [arquivo])
        await cliente.query('COMMIT')
      } catch (erro) {
        await cliente.query('ROLLBACK')
        if (erro.code === '42P07' && aplicadas.size === 0) {
          erro.dica =
            'Esse banco já tem as tabelas da versão antiga do Financify. Use um banco novo (ex.: o do docker-compose) ou apague as tabelas antigas.'
        }
        erro.message = `falha na migração ${arquivo}: ${erro.message}`
        throw erro
      }
      novas += 1
      log(`migração aplicada: ${arquivo}`)
    }
    log(novas ? `${novas} migração(ões) aplicada(s).` : 'banco atualizado.')
  } finally {
    await cliente.query('SELECT pg_advisory_unlock($1::bigint)', [CHAVE_DA_TRAVA]).catch(() => {})
    cliente.release()
  }
}

// Cria o banco do DATABASE_URL caso ele ainda não exista (útil com um Postgres instalado na máquina).
async function garantirBancoExiste(urlDoBanco) {
  const url = new URL(urlDoBanco)
  const nome = decodeURIComponent(url.pathname.slice(1))
  url.pathname = '/postgres'
  const cliente = new Client({ connectionString: url.toString() })
  await cliente.connect()
  try {
    const { rowCount } = await cliente.query('SELECT 1 FROM pg_database WHERE datname = $1', [nome])
    if (rowCount > 0) return false
    await cliente.query(`CREATE DATABASE "${nome.replaceAll('"', '""')}"`)
    return true
  } finally {
    await cliente.end()
  }
}

// Traduz os erros de conexão mais comuns em uma orientação prática.
function explicarErroDoBanco(erro) {
  if (erro.dica) return `${erro.message}\n${erro.dica}`
  switch (erro.code) {
    case 'ECONNREFUSED':
      return 'Não foi possível conectar ao PostgreSQL. Ele está rodando? Com Docker: docker compose up -d'
    case 'ENOTFOUND':
      return 'Servidor do PostgreSQL não encontrado. Confira o host no DATABASE_URL do .env.'
    case '28P01':
      return 'Usuário ou senha do PostgreSQL incorretos. Confira o DATABASE_URL no .env.'
    case '3D000':
      return 'O banco de dados do DATABASE_URL não existe e não pôde ser criado.'
    default:
      return erro.message || String(erro)
  }
}

// Prepara o banco: cria se não existir e aplica as migrações pendentes.
async function prepararBanco(pool, urlDoBanco, { log = console.log } = {}) {
  try {
    await migrar(pool, { log })
  } catch (erro) {
    if (erro.code !== '3D000') throw erro
    if (await garantirBancoExiste(urlDoBanco)) log('banco de dados criado.')
    await migrar(pool, { log })
  }
}

module.exports = { migrar, garantirBancoExiste, prepararBanco, explicarErroDoBanco }

// Execução direta: npm run db:migrate
if (require.main === module) {
  let config
  try {
    config = require('../config/env')
  } catch (erro) {
    console.error(erro.message)
    process.exit(1)
  }
  const pool = require('./pool')
  prepararBanco(pool, config.databaseUrl)
    .catch((erro) => {
      console.error(explicarErroDoBanco(erro))
      process.exitCode = 1
    })
    .finally(() => pool.end())
}
