const service = require('../services/transactions')
const schemas = require('../validations/transactions')
const { validate } = require('../validations/validator')
const { badRequest } = require('../utils/errors')

function checkPeriod({ from, to }) {
  if (from && to && from > to) throw badRequest({ to: 'must be the same as or later than "from"' })
}

async function list(req, res) {
  const filters = validate(schemas.listFilters, req.query)
  checkPeriod(filters)
  res.json(await service.list(req.user.id, filters))
}

async function show(req, res) {
  const { id } = validate(schemas.idParam, req.params)
  res.json(await service.show(req.user.id, id))
}

async function create(req, res) {
  const data = validate(schemas.transaction, req.body)
  res.status(201).json(await service.create(req.user.id, data))
}

async function update(req, res) {
  const { id } = validate(schemas.idParam, req.params)
  const data = validate(schemas.transaction, req.body)
  res.json(await service.update(req.user.id, id, data))
}

async function remove(req, res) {
  const { id } = validate(schemas.idParam, req.params)
  await service.remove(req.user.id, id)
  res.status(204).end()
}

async function statement(req, res) {
  const period = validate(schemas.period, req.query)
  checkPeriod(period)
  res.json(await service.statement(req.user.id, period))
}

async function monthlySummary(req, res) {
  const { year = new Date().getFullYear() } = validate(schemas.monthlySummary, req.query)
  res.json(await service.monthlySummary(req.user.id, year))
}

module.exports = { list, show, create, update, remove, statement, monthlySummary }
