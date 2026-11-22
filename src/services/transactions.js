const transactions = require('../repositories/transactions')
const { notFound, badRequest } = require('../utils/errors')

const DEFAULT_LIMIT = 20
const NOT_FOUND = 'Transaction not found.'

// If the category does not exist, the database refuses it through the foreign key; this turns that into a 400.
async function withValidCategory(operation) {
  try {
    return await operation()
  } catch (error) {
    if (error.code === '23503' && error.constraint === 'transactions_category_id_fkey') {
      throw badRequest({ category_id: 'category not found' })
    }
    throw error
  }
}

async function list(userId, { page = 1, limit = DEFAULT_LIMIT, order = 'desc', category_id, ...filters }) {
  const { transactions: items, total } = await transactions.list(
    userId,
    { ...filters, categories: category_id },
    { limit, offset: (page - 1) * limit, order },
  )
  return {
    transactions: items,
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  }
}

async function show(userId, id) {
  const transaction = await transactions.find(userId, id)
  if (!transaction) throw notFound(NOT_FOUND)
  return transaction
}

function create(userId, data) {
  return withValidCategory(() => transactions.create(userId, data))
}

async function update(userId, id, data) {
  const transaction = await withValidCategory(() => transactions.update(userId, id, data))
  if (!transaction) throw notFound(NOT_FOUND)
  return transaction
}

async function remove(userId, id) {
  const deleted = await transactions.remove(userId, id)
  if (!deleted) throw notFound(NOT_FOUND)
}

async function statement(userId, { from, to }) {
  const period = { from, to }
  const [{ income, expenses }, byCategory] = await Promise.all([
    transactions.totals(userId, period),
    transactions.totalsByCategory(userId, period),
  ])
  return {
    period: { from: from ?? null, to: to ?? null },
    income,
    expenses,
    balance: income - expenses,
    by_category: byCategory,
  }
}

// Always returns the 12 months of the year (zero where there were no transactions), ready for charts.
async function monthlySummary(userId, year) {
  const rows = await transactions.totalsByMonth(userId, year)
  const byMonth = new Map(rows.map((row) => [row.month, row]))
  const months = Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, '0')}`
    const { income = 0, expenses = 0 } = byMonth.get(month) ?? {}
    return { month, income, expenses, balance: income - expenses }
  })
  return { year, months }
}

module.exports = { list, show, create, update, remove, statement, monthlySummary }
