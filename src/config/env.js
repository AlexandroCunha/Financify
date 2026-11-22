const path = require('node:path')

const nodeMajor = Number(process.versions.node.split('.')[0])
if (nodeMajor < 22) {
  throw new Error(
    `Financify needs Node.js 22 or newer (you are using ${process.version}). Get the LTS version at https://nodejs.org`,
  )
}

// Loads the .env at the project root, if there is one.
// Variables already set in the environment (e.g. on the production server) take priority.
try {
  process.loadEnvFile(path.resolve(__dirname, '../../.env'))
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}

function required(name) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`The environment variable ${name} is not set. Run "npm run setup" or copy .env.example to .env.`)
  }
  return value
}

function integer(name, fallback) {
  const value = process.env[name]?.trim()
  if (!value) return fallback
  const number = Number(value)
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`The environment variable ${name} must be a whole number, zero or more.`)
  }
  return number
}

// TRUST_PROXY takes the same values as Express: a number of proxies, true/false or a list of IPs.
function trustProxy(value) {
  if (value === undefined || value.trim() === '') return undefined
  if (value === 'true') return true
  if (value === 'false') return false
  if (/^\d+$/.test(value)) return Number(value)
  return value
}

const config = {
  environment: process.env.NODE_ENV || 'development',
  port: integer('PORT', 3000),
  databaseUrl: required('DATABASE_URL'),
  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN?.trim() || '1d',
  },
  corsOrigins: (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  loginMaxAttempts: integer('LOGIN_MAX_ATTEMPTS', 10),
  demoMaxPerIp: integer('DEMO_MAX_PER_IP', 5),
  trustProxy: trustProxy(process.env.TRUST_PROXY),
}

if (config.jwt.secret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long. Run "npm run setup" to generate a random one.')
}

module.exports = config
