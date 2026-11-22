const pool = require('../db/pool')

const COLUMNS = `
  t.id, t.type, t.description, t.amount, t.date, t.category_id,
  c.name AS category_name, t.created_at, t.updated_at`

// Builds the WHERE clause from the filters. Always limited to the owner of the transactions.
function buildFilters(userId, { type, categories, from, to } = {}) {
  const conditions = ['t.user_id = $1']
  const params = [userId]
  const add = (condition, value) => {
    params.push(value)
    conditions.push(condition.replace('?', `$${params.length}`))
  }
  if (type) add('t.type = ?', type)
  if (categories?.length) add('t.category_id = ANY(?::int[])', categories)
  if (from) add('t.date >= ?', from)
  if (to) add('t.date <= ?', to)
  return { where: `WHERE ${conditions.join(' AND ')}`, params }
}

async function list(userId, filters, { limit, offset, order }) {
  const { where, params } = buildFilters(userId, filters)
  const direction = order === 'asc' ? 'ASC' : 'DESC'
  const [page, count] = await Promise.all([
    pool.query(
      `SELECT ${COLUMNS}
         FROM transactions t
         JOIN categories c ON c.id = t.category_id
        ${where}
        ORDER BY t.date ${direction}, t.id ${direction}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    ),
    pool.query(`SELECT count(*) AS total FROM transactions t ${where}`, params),
  ])
  return { transactions: page.rows, total: count.rows[0].total }
}

async function find(userId, id) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS}
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
      WHERE t.id = $1 AND t.user_id = $2`,
    [id, userId],
  )
  return rows[0] ?? null
}

async function create(userId, { description, amount, date, category_id, type }) {
  const { rows } = await pool.query(
    `WITH t AS (
       INSERT INTO transactions (description, amount, date, category_id, type, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *
     )
     SELECT ${COLUMNS} FROM t JOIN categories c ON c.id = t.category_id`,
    [description, amount, date, category_id, type, userId],
  )
  return rows[0]
}

// Only updates the transaction if it belongs to the user; otherwise returns null.
async function update(userId, id, { description, amount, date, category_id, type }) {
  const { rows } = await pool.query(
    `WITH t AS (
       UPDATE transactions
          SET description = $3, amount = $4, date = $5, category_id = $6, type = $7, updated_at = now()
        WHERE id = $1 AND user_id = $2
    RETURNING *
     )
     SELECT ${COLUMNS} FROM t JOIN categories c ON c.id = t.category_id`,
    [id, userId, description, amount, date, category_id, type],
  )
  return rows[0] ?? null
}

async function remove(userId, id) {
  const { rowCount } = await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, userId])
  return rowCount > 0
}

async function totals(userId, period) {
  const { where, params } = buildFilters(userId, period)
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'income'), 0)  AS income,
            COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'expense'), 0) AS expenses
       FROM transactions t
      ${where}`,
    params,
  )
  return rows[0]
}

async function totalsByCategory(userId, period) {
  const { where, params } = buildFilters(userId, period)
  const { rows } = await pool.query(
    `SELECT t.category_id, c.name AS category_name, t.type,
            SUM(t.amount) AS total, count(*) AS count
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
      ${where}
      GROUP BY t.category_id, c.name, t.type
      ORDER BY total DESC, c.name`,
    params,
  )
  return rows
}

async function totalsByMonth(userId, year) {
  const { rows } = await pool.query(
    `SELECT to_char(t.date, 'YYYY-MM') AS month,
            COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'income'), 0)  AS income,
            COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'expense'), 0) AS expenses
       FROM transactions t
      WHERE t.user_id = $1
        AND t.date >= make_date($2::int, 1, 1)
        AND t.date <  make_date($2::int + 1, 1, 1)
      GROUP BY 1
      ORDER BY 1`,
    [userId, year],
  )
  return rows
}

module.exports = {
  list,
  find,
  create,
  update,
  remove,
  totals,
  totalsByCategory,
  totalsByMonth,
}
