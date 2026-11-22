const fs = require('node:fs/promises')
const path = require('node:path')
const { Client } = require('pg')

const MIGRATIONS_DIR = path.join(__dirname, 'migrations')
const LOCK_KEY = 4815162342 // stops two processes from applying migrations at the same time

// Migration files that were renamed when the project moved to English.
// Databases created before that recorded them under the old names.
const RENAMED_MIGRATIONS = {
  '001_estrutura_inicial.sql': '001_initial_schema.sql',
  '002_categorias_padrao.sql': '002_default_categories.sql',
  '003_moeda_euro.sql': '003_euro_currency.sql',
  '004_contas_demo.sql': '004_demo_accounts.sql',
}

// Creates the table that records applied migrations. Databases from before the English
// version have it as "migracoes" (nome, aplicada_em): it is renamed, and so are the old file names.
async function prepareMigrationsTable(client) {
  await client.query(`
    DO $$
    BEGIN
      IF to_regclass('migracoes') IS NOT NULL AND to_regclass('schema_migrations') IS NULL THEN
        ALTER TABLE migracoes RENAME TO schema_migrations;
        ALTER TABLE schema_migrations RENAME COLUMN nome TO name;
        ALTER TABLE schema_migrations RENAME COLUMN aplicada_em TO applied_at;
        ALTER TABLE schema_migrations RENAME CONSTRAINT migracoes_pkey TO schema_migrations_pkey;
      END IF;
    END $$
  `)
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  for (const [oldName, newName] of Object.entries(RENAMED_MIGRATIONS)) {
    await client.query('UPDATE schema_migrations SET name = $2 WHERE name = $1', [oldName, newName])
  }
}

// Applies, in order, the .sql files in src/db/migrations that have not been applied yet.
async function migrate(pool, { log = console.log } = {}) {
  const client = await pool.connect()
  try {
    await client.query('SELECT pg_advisory_lock($1::bigint)', [LOCK_KEY])
    await prepareMigrationsTable(client)
    const { rows } = await client.query('SELECT name FROM schema_migrations')
    const applied = new Set(rows.map((row) => row.name))
    const files = (await fs.readdir(MIGRATIONS_DIR)).filter((name) => name.endsWith('.sql')).sort()

    let count = 0
    for (const file of files) {
      if (applied.has(file)) continue
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
      try {
        await client.query('BEGIN')
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        if (error.code === '42P07' && applied.size === 0) {
          error.hint =
            'This database already has the tables of the old Financify version. Use a new database (e.g. the docker-compose one) or drop the old tables.'
        }
        error.message = `migration ${file} failed: ${error.message}`
        throw error
      }
      count += 1
      log(`migration applied: ${file}`)
    }
    log(count ? `${count} migration(s) applied.` : 'database is up to date.')
  } finally {
    await client.query('SELECT pg_advisory_unlock($1::bigint)', [LOCK_KEY]).catch(() => {})
    client.release()
  }
}

// Creates the DATABASE_URL database if it does not exist yet (handy with a locally installed Postgres).
async function ensureDatabaseExists(databaseUrl) {
  const url = new URL(databaseUrl)
  const name = decodeURIComponent(url.pathname.slice(1))
  url.pathname = '/postgres'
  const client = new Client({ connectionString: url.toString() })
  await client.connect()
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name])
    if (rowCount > 0) return false
    await client.query(`CREATE DATABASE "${name.replaceAll('"', '""')}"`)
    return true
  } finally {
    await client.end()
  }
}

// Turns the most common connection errors into practical advice.
function explainDatabaseError(error) {
  if (error.hint) return `${error.message}\n${error.hint}`
  switch (error.code) {
    case 'ECONNREFUSED':
      return 'Could not connect to PostgreSQL. Is it running? With Docker: docker compose up -d'
    case 'ENOTFOUND':
      return 'PostgreSQL server not found. Check the host in DATABASE_URL in your .env.'
    case '28P01':
      return 'Wrong PostgreSQL user or password. Check DATABASE_URL in your .env.'
    case '3D000':
      return 'The DATABASE_URL database does not exist and could not be created.'
    default:
      return error.message || String(error)
  }
}

// Prepares the database: creates it if needed and applies pending migrations.
async function prepareDatabase(pool, databaseUrl, { log = console.log } = {}) {
  try {
    await migrate(pool, { log })
  } catch (error) {
    if (error.code !== '3D000') throw error
    if (await ensureDatabaseExists(databaseUrl)) log('database created.')
    await migrate(pool, { log })
  }
}

module.exports = { migrate, ensureDatabaseExists, prepareDatabase, explainDatabaseError }

// Run directly: npm run db:migrate
if (require.main === module) {
  let config
  try {
    config = require('../config/env')
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
  const pool = require('./pool')
  prepareDatabase(pool, config.databaseUrl)
    .catch((error) => {
      console.error(explainDatabaseError(error))
      process.exitCode = 1
    })
    .finally(() => pool.end())
}
