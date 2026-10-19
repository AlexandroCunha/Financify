const path = require('node:path')

const versaoDoNode = Number(process.versions.node.split('.')[0])
if (versaoDoNode < 22) {
  throw new Error(
    `O Financify precisa do Node.js 22 ou mais novo (você está usando ${process.version}). Baixe a versão LTS em https://nodejs.org`,
  )
}

// Carrega o .env da raiz do projeto, se existir.
// Variáveis já definidas no ambiente (ex.: no servidor de produção) têm prioridade.
try {
  process.loadEnvFile(path.resolve(__dirname, '../../.env'))
} catch (erro) {
  if (erro.code !== 'ENOENT') throw erro
}

function obrigatoria(nome) {
  const valor = process.env[nome]?.trim()
  if (!valor) {
    throw new Error(
      `A variável de ambiente ${nome} não foi definida. Rode "npm run setup" ou copie o .env.example para .env.`,
    )
  }
  return valor
}

function inteiro(nome, padrao) {
  const valor = process.env[nome]?.trim()
  if (!valor) return padrao
  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero < 0) {
    throw new Error(`A variável de ambiente ${nome} deve ser um número inteiro maior ou igual a zero.`)
  }
  return numero
}

// TRUST_PROXY aceita o mesmo que o Express: número de proxies, true/false ou uma lista de IPs.
function trustProxy(valor) {
  if (valor === undefined || valor.trim() === '') return undefined
  if (valor === 'true') return true
  if (valor === 'false') return false
  if (/^\d+$/.test(valor)) return Number(valor)
  return valor
}

const config = {
  ambiente: process.env.NODE_ENV || 'development',
  porta: inteiro('PORT', 3000),
  databaseUrl: obrigatoria('DATABASE_URL'),
  jwt: {
    segredo: obrigatoria('JWT_SECRET'),
    expiraEm: process.env.JWT_EXPIRES_IN?.trim() || '1d',
  },
  corsOrigens: (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origem) => origem.trim())
    .filter(Boolean),
  loginMaxTentativas: inteiro('LOGIN_MAX_TENTATIVAS', 10),
  trustProxy: trustProxy(process.env.TRUST_PROXY),
}

if (config.jwt.segredo.length < 32) {
  throw new Error(
    'O JWT_SECRET precisa ter pelo menos 32 caracteres. Rode "npm run setup" para gerar um aleatório.',
  )
}

module.exports = config
