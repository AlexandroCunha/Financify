const pool = require('../db/pool')

// Creates the demo account and its transactions in a single database transaction, and also
// deletes old demo accounts (their transactions go with them, by CASCADE).
async function createWithTransactions({ name, email, passwordHash, transactions, lifetimeHours }) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`DELETE FROM users WHERE demo AND created_at < now() - make_interval(hours => $1)`, [
      lifetimeHours,
    ])
    const {
      rows: [user],
    } = await client.query(
      `INSERT INTO users (name, email, password, demo)
       VALUES ($1, $2, $3, true)
       RETURNING id, name, email, demo, created_at`,
      [name, email, passwordHash],
    )
    await client.query(
      `INSERT INTO transactions (description, amount, date, type, category_id, user_id)
       SELECT x.description, x.amount, x.date::date, x.type, c.id, $6
         FROM unnest($1::text[], $2::int[], $3::text[], $4::text[], $5::text[])
              AS x(description, amount, date, type, category)
         JOIN categories c ON c.name = x.category`,
      [
        transactions.map((t) => t.description),
        transactions.map((t) => t.amount),
        transactions.map((t) => t.date),
        transactions.map((t) => t.type),
        transactions.map((t) => t.category),
        user.id,
      ],
    )
    await client.query('COMMIT')
    return user
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

module.exports = { createWithTransactions }
