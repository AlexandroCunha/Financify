const pool = require('../db/pool')

// Colunas que podem sair na resposta (a senha nunca entra aqui).
const COLUNAS_PUBLICAS = 'id, nome, email, criado_em'

async function buscarPorId(id) {
  const { rows } = await pool.query(`SELECT ${COLUNAS_PUBLICAS} FROM usuarios WHERE id = $1`, [id])
  return rows[0] ?? null
}

async function buscarComSenhaPorEmail(email) {
  const { rows } = await pool.query(`SELECT ${COLUNAS_PUBLICAS}, senha FROM usuarios WHERE email = $1`, [email])
  return rows[0] ?? null
}

async function buscarSenha(id) {
  const { rows } = await pool.query('SELECT senha FROM usuarios WHERE id = $1', [id])
  return rows[0]?.senha ?? null
}

async function criar({ nome, email, senhaHash }) {
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nome, email, senha)
     VALUES ($1, $2, $3)
     RETURNING ${COLUNAS_PUBLICAS}`,
    [nome, email, senhaHash],
  )
  return rows[0]
}

// Atualiza só os campos informados (os outros ficam como estão).
async function atualizar(id, { nome, email }) {
  const { rows } = await pool.query(
    `UPDATE usuarios
        SET nome = COALESCE($2, nome),
            email = COALESCE($3, email),
            atualizado_em = now()
      WHERE id = $1
  RETURNING ${COLUNAS_PUBLICAS}`,
    [id, nome ?? null, email ?? null],
  )
  return rows[0] ?? null
}

async function atualizarSenha(id, senhaHash) {
  await pool.query('UPDATE usuarios SET senha = $2, atualizado_em = now() WHERE id = $1', [id, senhaHash])
}

// As transações do usuário são apagadas junto (ON DELETE CASCADE).
async function excluir(id) {
  const { rowCount } = await pool.query('DELETE FROM usuarios WHERE id = $1', [id])
  return rowCount > 0
}

module.exports = {
  buscarPorId,
  buscarComSenhaPorEmail,
  buscarSenha,
  criar,
  atualizar,
  atualizarSenha,
  excluir,
}
