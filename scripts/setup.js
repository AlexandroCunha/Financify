// Creates the .env file from .env.example, with a random JWT_SECRET.
// Usage: npm run setup
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const target = path.join(root, '.env')

if (fs.existsSync(target)) {
  console.log('The .env file already exists. Nothing was changed.')
  process.exit(0)
}

const template = fs.readFileSync(path.join(root, '.env.example'), 'utf8')
const secret = crypto.randomBytes(32).toString('hex')
fs.writeFileSync(target, template.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`))

console.log('Created .env with a random JWT_SECRET.')
console.log('If you are not using Docker, point DATABASE_URL at your PostgreSQL.')
