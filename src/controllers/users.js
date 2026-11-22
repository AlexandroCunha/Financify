const service = require('../services/users')
const schemas = require('../validations/users')
const { validate } = require('../validations/validator')
const { forbidden, badRequest } = require('../utils/errors')

const REAL_ACCOUNTS_ONLY = 'This is not available in a demo account. Create an account to use it.'

async function signUp(req, res) {
  const data = validate(schemas.signUp, req.body)
  res.status(201).json(await service.signUp(data))
}

function show(req, res) {
  res.json(req.user)
}

async function update(req, res) {
  const data = validate(schemas.update, req.body)
  // In a demo account the e-mail cannot change: stops anyone from parking someone else's e-mail in one.
  if (req.user.demo && data.email !== undefined) throw forbidden(REAL_ACCOUNTS_ONLY)
  if (Object.keys(data).length === 0) {
    throw badRequest(undefined, 'Send at least one field to update: name or email.')
  }
  res.json(await service.updateProfile(req.user.id, data))
}

async function changePassword(req, res) {
  if (req.user.demo) throw forbidden(REAL_ACCOUNTS_ONLY)
  const data = validate(schemas.passwordChange, req.body)
  await service.changePassword(req.user.id, data)
  res.status(204).end()
}

async function remove(req, res) {
  await service.deleteAccount(req.user.id)
  res.status(204).end()
}

module.exports = { signUp, show, update, changePassword, remove }
