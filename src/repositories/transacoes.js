const pool = require('../db/pool')

const COLUNAS = `
  t.id, t.tipo, t.descricao, t.valor, t.data, t.categoria_id,
  c.descricao AS categoria_nome, t.criado_em, t.atualizado_em`

// Monta o WHERE a partir dos filtros. Sempre restringe ao dono das transações.
function montarFiltros(usuarioId, { tipo, categorias, de, ate } = {}) {
  const condicoes = ['t.usuario_id = $1']
  const parametros = [usuarioId]
  const adicionar = (condicao, valor) => {
    parametros.push(valor)
    condicoes.push(condicao.replace('?', `$${parametros.length}`))
  }
  if (tipo) adicionar('t.tipo = ?', tipo)
  if (categorias?.length) adicionar('t.categoria_id = ANY(?::int[])', categorias)
  if (de) adicionar('t.data >= ?', de)
  if (ate) adicionar('t.data <= ?', ate)
  return { where: `WHERE ${condicoes.join(' AND ')}`, parametros }
}

async function listar(usuarioId, filtros, { limite, deslocamento, ordem }) {
  const { where, parametros } = montarFiltros(usuarioId, filtros)
  const direcao = ordem === 'asc' ? 'ASC' : 'DESC'
  const [pagina, contagem] = await Promise.all([
    pool.query(
      `SELECT ${COLUNAS}
         FROM transacoes t
         JOIN categorias c ON c.id = t.categoria_id
        ${where}
        ORDER BY t.data ${direcao}, t.id ${direcao}
        LIMIT $${parametros.length + 1} OFFSET $${parametros.length + 2}`,
      [...parametros, limite, deslocamento],
    ),
    pool.query(`SELECT count(*) AS total FROM transacoes t ${where}`, parametros),
  ])
  return { transacoes: pagina.rows, total: contagem.rows[0].total }
}

async function buscar(usuarioId, id) {
  const { rows } = await pool.query(
    `SELECT ${COLUNAS}
       FROM transacoes t
       JOIN categorias c ON c.id = t.categoria_id
      WHERE t.id = $1 AND t.usuario_id = $2`,
    [id, usuarioId],
  )
  return rows[0] ?? null
}

async function criar(usuarioId, { descricao, valor, data, categoria_id, tipo }) {
  const { rows } = await pool.query(
    `WITH t AS (
       INSERT INTO transacoes (descricao, valor, data, categoria_id, tipo, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *
     )
     SELECT ${COLUNAS} FROM t JOIN categorias c ON c.id = t.categoria_id`,
    [descricao, valor, data, categoria_id, tipo, usuarioId],
  )
  return rows[0]
}

// Só atualiza se a transação for do usuário; senão devolve null.
async function atualizar(usuarioId, id, { descricao, valor, data, categoria_id, tipo }) {
  const { rows } = await pool.query(
    `WITH t AS (
       UPDATE transacoes
          SET descricao = $3, valor = $4, data = $5, categoria_id = $6, tipo = $7, atualizado_em = now()
        WHERE id = $1 AND usuario_id = $2
    RETURNING *
     )
     SELECT ${COLUNAS} FROM t JOIN categorias c ON c.id = t.categoria_id`,
    [id, usuarioId, descricao, valor, data, categoria_id, tipo],
  )
  return rows[0] ?? null
}

async function excluir(usuarioId, id) {
  const { rowCount } = await pool.query('DELETE FROM transacoes WHERE id = $1 AND usuario_id = $2', [
    id,
    usuarioId,
  ])
  return rowCount > 0
}

async function totais(usuarioId, periodo) {
  const { where, parametros } = montarFiltros(usuarioId, periodo)
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(t.valor) FILTER (WHERE t.tipo = 'entrada'), 0) AS entrada,
            COALESCE(SUM(t.valor) FILTER (WHERE t.tipo = 'saida'), 0)   AS saida
       FROM transacoes t
      ${where}`,
    parametros,
  )
  return rows[0]
}

async function totaisPorCategoria(usuarioId, periodo) {
  const { where, parametros } = montarFiltros(usuarioId, periodo)
  const { rows } = await pool.query(
    `SELECT t.categoria_id, c.descricao AS categoria_nome, t.tipo,
            SUM(t.valor) AS total, count(*) AS quantidade
       FROM transacoes t
       JOIN categorias c ON c.id = t.categoria_id
      ${where}
      GROUP BY t.categoria_id, c.descricao, t.tipo
      ORDER BY total DESC, c.descricao`,
    parametros,
  )
  return rows
}

async function totaisPorMes(usuarioId, ano) {
  const { rows } = await pool.query(
    `SELECT to_char(t.data, 'YYYY-MM') AS mes,
            COALESCE(SUM(t.valor) FILTER (WHERE t.tipo = 'entrada'), 0) AS entrada,
            COALESCE(SUM(t.valor) FILTER (WHERE t.tipo = 'saida'), 0)   AS saida
       FROM transacoes t
      WHERE t.usuario_id = $1
        AND t.data >= make_date($2::int, 1, 1)
        AND t.data <  make_date($2::int + 1, 1, 1)
      GROUP BY 1
      ORDER BY 1`,
    [usuarioId, ano],
  )
  return rows
}

module.exports = {
  listar,
  buscar,
  criar,
  atualizar,
  excluir,
  totais,
  totaisPorCategoria,
  totaisPorMes,
}
