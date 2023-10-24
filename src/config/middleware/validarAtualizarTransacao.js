const pool = require('../connections/conexao')

const validarDadosParaAtualizarTransacao = async (req, res, next) => {
    const { id: idUsuario } = req.usuario
    const { id: idTransacao } = req.params
    const { descricao, valor, data, categoria_id, tipo } = req.body

    const transacaoQuery = await pool.query(
        'select usuario_id from transacoes where id = $1',
        [idTransacao]
    )

    if (transacaoQuery.rows.length !== 1) {
        return res.status(404).json({ mensagem: 'Transação não encontrada.' })
    }

    if (transacaoQuery.rows[0].usuario_id !== idUsuario) {
        return res.status(403).json({ mensagem: 'Essa transação não existe.' })
    }

    if (!descricao || !valor || !data || !categoria_id || !tipo) {
        return res.status(400).json({ mensagem: 'Todos os campos obrigatórios devem ser informados.' })
    }

    const categoriaQuery = await pool.query(
        'select id from categorias where id = $1',
        [categoria_id]
    )

    if (categoriaQuery.rows.length !== 1) {
        return res.status(404).json({ mensagem: 'Categoria não encontrada.' })
    }

    if (tipo !== 'entrada' && tipo !== 'saida') {
        return res.status(400).json({ mensagem: 'O campo "tipo" deve ser "entrada" ou "saida" exatamente como descrito.' })
    }

    next()
}

module.exports = validarDadosParaAtualizarTransacao