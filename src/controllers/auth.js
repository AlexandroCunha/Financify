const service = require('../services/auth')
const schemas = require('../validations/users')
const { validate } = require('../validations/validator')

async function login(req, res) {
  const credentials = validate(schemas.login, req.body)
  res.json(await service.login(credentials))
}

module.exports = { login }
