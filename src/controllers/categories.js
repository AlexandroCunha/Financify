const categories = require('../repositories/categories')

async function list(req, res) {
  res.json(await categories.list())
}

module.exports = { list }
