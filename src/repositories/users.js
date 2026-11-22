const pool = require('../db/pool')

// Columns that may go out in a response (the password never does).
const PUBLIC_COLUMNS = 'id, name, email, demo, created_at'

async function findById(id) {
  const { rows } = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id])
  return rows[0] ?? null
}

async function findWithPasswordByEmail(email) {
  const { rows } = await pool.query(`SELECT ${PUBLIC_COLUMNS}, password FROM users WHERE email = $1`, [email])
  return rows[0] ?? null
}

async function findPassword(id) {
  const { rows } = await pool.query('SELECT password FROM users WHERE id = $1', [id])
  return rows[0]?.password ?? null
}

async function create({ name, email, passwordHash }) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password)
     VALUES ($1, $2, $3)
     RETURNING ${PUBLIC_COLUMNS}`,
    [name, email, passwordHash],
  )
  return rows[0]
}

// Only updates the fields that were sent (the others stay as they are).
async function update(id, { name, email }) {
  const { rows } = await pool.query(
    `UPDATE users
        SET name = COALESCE($2, name),
            email = COALESCE($3, email),
            updated_at = now()
      WHERE id = $1
  RETURNING ${PUBLIC_COLUMNS}`,
    [id, name ?? null, email ?? null],
  )
  return rows[0] ?? null
}

async function updatePassword(id, passwordHash) {
  await pool.query('UPDATE users SET password = $2, updated_at = now() WHERE id = $1', [id, passwordHash])
}

// The user's transactions are deleted with it (ON DELETE CASCADE).
async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id])
  return rowCount > 0
}

module.exports = {
  findById,
  findWithPasswordByEmail,
  findPassword,
  create,
  update,
  updatePassword,
  remove,
}
