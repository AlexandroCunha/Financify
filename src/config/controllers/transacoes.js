const pool = require("../connections/conexao")

const transacoesDoUsuario = async (req, res) => {
    const { id } = req.usuario

    try {
        const query = await pool.query(`
        select transacoes.*, categorias.descricao as categoria_nome from transacoes join categorias
        on transacoes.categoria_id = categorias.id where transacoes.usuario_id = $1`, [id])

        res.json(query.rows)
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' })
    }
}

const detalharTransacao = async (req, res) => {
    const { id: idUsuario } = req.usuario
    const { id: idTransacao } = req.params

    try {
        const query = await pool.query(`
            select transacoes.*, categorias.descricao as categoria_nome
            from transacoes
            join categorias on transacoes.categoria_id = categorias.id
            where transacoes.id = $1 and transacoes.usuario_id = $2
        `, [idTransacao, idUsuario])

        return res.json(query.rows)
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' })
    }
}

const cadastrarTransacao = async (req, res) => {
    const { descricao, valor, data, categoria_id, tipo } = req.body
    const { id: usuario_id } = req.usuario

    try {
        const query = `
        insert into transacoes (tipo, descricao, valor, data, categoria_id, usuario_id)
        values ($1, $2, $3, $4, $5, $6) returning *`

        const params = [tipo, descricao, valor, data, categoria_id, usuario_id]

        const { rows } = await pool.query(query, params)

        return res.status(201).json(rows[0])
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' })
    }

}

const atualizarTransacao = async (req, res) => {
    const { id: idTransacao } = req.params
    const { descricao, valor, data, categoria_id, tipo } = req.body;

    try {
        await pool.query('update transacoes set descricao = $1, valor = $2, data = $3, categoria_id = $4, tipo = $5 where id = $6', [descricao, valor, data, categoria_id, tipo, idTransacao])

        res.sendStatus(204)
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' })
    }
}

module.exports = {
    transacoesDoUsuario,
    cadastrarTransacao,
    detalharTransacao,
    atualizarTransacao
}