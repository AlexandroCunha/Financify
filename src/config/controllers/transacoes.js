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

const deletarTransacao = async (req, res) => {
    const { id } = req.params

    try {
        await pool.query('delete from transacoes where id = $1', [id])

        res.status(204).send()

    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' })
    }
}

const filtrarTransacao = async (req, res) => {
    const filtros = req.query.filtro;
    const { id: idUsuario } = req.usuario;

    try {
        let query = `
        SELECT transacoes.id, transacoes.tipo, transacoes.descricao, transacoes.valor, transacoes.data, transacoes.usuario_id,
        categorias.id as categoria_id, categorias.descricao as categoria_nome
        FROM transacoes
        JOIN categorias ON transacoes.categoria_id = categorias.id
        WHERE transacoes.usuario_id = $1`

        const params = [idUsuario]

        if (filtros && filtros.length > 0) {
            const filtrosPorCategoria = filtros.map((_, index) => `$${index + 2}`).join(', ')
            query += ` AND categorias.descricao ILIKE ANY(ARRAY[${filtrosPorCategoria}])`
            params.push(...filtros)
        }

        const resultado = await pool.query(query, params)
        const transacoesFiltradas = resultado.rows

        res.status(200).json(transacoesFiltradas)
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' })
    }
}

const obterExtrato = async (req, res) => {
    try {
        const { id } = req.usuario

        const query = `
        SELECT
          SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as soma_entradas,
          SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as soma_saidas
        FROM transacoes WHERE usuario_id = $1;`;

        const { rows } = await pool.query(query, [id])

        if (rows[0]) {
            const extrato = rows[0];
            const entrada = extrato.soma_entradas || 0
            const saida = extrato.soma_saidas || 0

            res.status(200).json({ entrada, saida })
        } else {
            res.status(200).json({ entrada: 0, saida: 0 })
        }
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro interno do servidor.' })
    }
}

module.exports = {
    transacoesDoUsuario,
    cadastrarTransacao,
    detalharTransacao,
    atualizarTransacao,
    deletarTransacao,
    obterExtrato,
    filtrarTransacao
}