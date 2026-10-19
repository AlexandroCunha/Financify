// Utilitários dos testes: banco de testes isolado e a API rodando numa porta aleatória.
const assert = require('node:assert/strict')
const http = require('node:http')
const { once } = require('node:events')
const path = require('node:path')

// Configuração definida antes de carregar a aplicação (o .env não sobrescreve variáveis já definidas).
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'segredo-usado-somente-nos-testes-0123456789'
process.env.CORS_ORIGIN = 'http://localhost:5173'
process.env.LOGIN_MAX_TENTATIVAS = '0'
try {
  process.loadEnvFile(path.resolve(__dirname, '../.env'))
} catch (erro) {
  if (erro.code !== 'ENOENT') throw erro
}
process.env.DATABASE_URL = urlDoBancoDeTeste()

// Por padrão usa o mesmo servidor do DATABASE_URL, num banco com "_test" no nome.
function urlDoBancoDeTeste() {
  if (process.env.DATABASE_URL_TEST) return process.env.DATABASE_URL_TEST
  if (!process.env.DATABASE_URL) {
    throw new Error('Defina DATABASE_URL (ou DATABASE_URL_TEST) no .env para rodar os testes.')
  }
  const url = new URL(process.env.DATABASE_URL)
  url.pathname = `${url.pathname}_test`
  return url.toString()
}

const { criarApp } = require('../src/app')
const pool = require('../src/db/pool')
const { prepararBanco } = require('../src/db/migrar')

let servidor
let base
const categorias = {}

async function subirApp(opcoes) {
  const novo = http.createServer(criarApp(opcoes)).listen(0, '127.0.0.1')
  await once(novo, 'listening')
  return { servidor: novo, base: `http://127.0.0.1:${novo.address().port}` }
}

async function iniciar() {
  await prepararBanco(pool, process.env.DATABASE_URL, { log: () => {} })
  const { rows } = await pool.query('SELECT id, descricao FROM categorias')
  for (const { id, descricao } of rows) categorias[descricao] = id
  const app = await subirApp()
  servidor = app.servidor
  base = app.base
}

async function encerrar() {
  await new Promise((resolve) => servidor.close(resolve))
  await pool.end()
}

async function limparBanco() {
  await pool.query('TRUNCATE usuarios RESTART IDENTITY CASCADE')
}

async function api(metodo, caminho, { token, corpo, cabecalhos = {}, baseUrl = base } = {}) {
  const headers = { ...cabecalhos }
  if (corpo !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  const resposta = await fetch(baseUrl + caminho, {
    method: metodo,
    headers,
    body: corpo === undefined || typeof corpo === 'string' ? corpo : JSON.stringify(corpo),
  })
  const texto = await resposta.text()
  let dados = texto || null
  try {
    dados = JSON.parse(texto)
  } catch {}
  return { status: resposta.status, corpo: dados, cabecalhos: resposta.headers }
}

let sequencia = 0
async function criarUsuarioLogado(dados = {}) {
  sequencia += 1
  const usuario = {
    nome: `Pessoa ${sequencia}`,
    email: `pessoa${sequencia}@teste.com`,
    senha: 'senha-segura-123',
    ...dados,
  }
  const cadastro = await api('POST', '/usuarios', { corpo: usuario })
  assert.equal(cadastro.status, 201, JSON.stringify(cadastro.corpo))
  const login = await api('POST', '/login', { corpo: { email: usuario.email, senha: usuario.senha } })
  assert.equal(login.status, 200, JSON.stringify(login.corpo))
  return { ...cadastro.corpo, senha: usuario.senha, token: login.corpo.token }
}

function novaTransacao(dados = {}) {
  return {
    descricao: 'Compra no mercado',
    valor: 1000,
    data: '2026-10-10',
    categoria_id: categorias.Mercado,
    tipo: 'saida',
    ...dados,
  }
}

async function criarTransacao(token, dados) {
  const resposta = await api('POST', '/transacoes', { token, corpo: novaTransacao(dados) })
  assert.equal(resposta.status, 201, JSON.stringify(resposta.corpo))
  return resposta.corpo
}

module.exports = {
  iniciar,
  encerrar,
  limparBanco,
  subirApp,
  api,
  criarUsuarioLogado,
  novaTransacao,
  criarTransacao,
  categorias,
  pool,
}
