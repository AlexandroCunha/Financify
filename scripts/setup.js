// Cria o arquivo .env a partir do .env.example, já com um JWT_SECRET aleatório.
// Uso: npm run setup
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const raiz = path.resolve(__dirname, '..')
const destino = path.join(raiz, '.env')

if (fs.existsSync(destino)) {
  console.log('O arquivo .env já existe. Nada foi alterado.')
  process.exit(0)
}

const modelo = fs.readFileSync(path.join(raiz, '.env.example'), 'utf8')
const segredo = crypto.randomBytes(32).toString('hex')
fs.writeFileSync(destino, modelo.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${segredo}`))

console.log('Arquivo .env criado com um JWT_SECRET aleatório.')
console.log('Se não for usar o Docker, ajuste o DATABASE_URL para o seu PostgreSQL.')
