const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const config = require('../config/env')
const users = require('../repositories/users')
const { unauthorized } = require('../utils/errors')

// When the e-mail does not exist, the password is compared with a dummy hash. That keeps the
// response time similar in both cases, so it does not reveal which e-mails have an account.
const DUMMY_HASH = bcrypt.hashSync('financify-dummy-hash', 10)

function createToken(userId, { expiresIn = config.jwt.expiresIn } = {}) {
  return jwt.sign({}, config.jwt.secret, {
    subject: String(userId),
    expiresIn,
    algorithm: 'HS256',
  })
}

async function login({ email, password }) {
  const user = await users.findWithPasswordByEmail(email)
  const passwordMatches = await bcrypt.compare(password, user?.password ?? DUMMY_HASH)
  if (!user || !passwordMatches) throw unauthorized('Invalid e-mail or password.')

  const { password: _hash, ...publicData } = user
  return { user: publicData, token: createToken(user.id) }
}

async function userFromToken(token) {
  let payload
  try {
    payload = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] })
  } catch (error) {
    throw unauthorized(error.name === 'TokenExpiredError' ? 'Token expired. Please sign in again.' : 'Invalid token.')
  }

  const id = Number(payload.sub)
  if (!Number.isInteger(id) || id < 1) throw unauthorized('Invalid token.')

  const user = await users.findById(id)
  if (!user) throw unauthorized('Invalid token.') // e.g. the account was deleted
  return user
}

module.exports = { login, userFromToken, createToken }
