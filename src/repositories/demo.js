const pool = require('../db/pool')

// Cria a conta de demonstração e as transações dela numa transação só, e aproveita
// para apagar as contas de demonstração antigas (as transações vão junto, por CASCADE).
async function criarComTransacoes({ nome, email, senhaHash, transacoes, horasDeVida }) {
  const cliente = await pool.connect()
  try {
    await cliente.query('BEGIN')
    await cliente.query(`DELETE FROM usuarios WHERE demo AND criado_em < now() - make_interval(hours => $1)`, [
      horasDeVida,
    ])
    const {
      rows: [usuario],
    } = await cliente.query(
      `INSERT INTO usuarios (nome, email, senha, demo)
       VALUES ($1, $2, $3, true)
       RETURNING id, nome, email, demo, criado_em`,
      [nome, email, senhaHash],
    )
    await cliente.query(
      `INSERT INTO transacoes (descricao, valor, data, tipo, categoria_id, usuario_id)
       SELECT x.descricao, x.valor, x.data::date, x.tipo, c.id, $6
         FROM unnest($1::text[], $2::int[], $3::text[], $4::text[], $5::text[])
              AS x(descricao, valor, data, tipo, categoria)
         JOIN categorias c ON c.descricao = x.categoria`,
      [
        transacoes.map((t) => t.descricao),
        transacoes.map((t) => t.valor),
        transacoes.map((t) => t.data),
        transacoes.map((t) => t.tipo),
        transacoes.map((t) => t.categoria),
        usuario.id,
      ],
    )
    await cliente.query('COMMIT')
    return usuario
  } catch (erro) {
    await cliente.query('ROLLBACK')
    throw erro
  } finally {
    cliente.release()
  }
}

module.exports = { criarComTransacoes }
