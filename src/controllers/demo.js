const service = require('../services/demo')

async function create(req, res) {
  res.status(201).json(await service.createDemoAccount())
}

module.exports = { create }
