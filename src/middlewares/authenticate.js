const { userFromToken } = require('../services/auth')
const { unauthorized } = require('../utils/errors')

// Requires the "Authorization: Bearer <token>" header and puts the user in req.user.
async function authenticate(req, res, next) {
  const [scheme, token] = (req.get('authorization') ?? '').trim().split(/\s+/)
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw unauthorized('Missing authentication token. Send the header Authorization: Bearer <token>.')
  }
  req.user = await userFromToken(token)
  next()
}

module.exports = authenticate
