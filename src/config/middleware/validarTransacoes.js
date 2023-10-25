const pool = require('../connections/conexao')
const bcrypt = require('bcrypt')

const validarDadosParaTransacoes = async (req, res, next) => {
    const { id: idTransacao } = req.params
    const { id: idUsuario } = req.usuario

    if (!idTransacao) {
        return res.status(400).json({ mensagem: 'O ID da transação é obrigatório para localizá-la.' })
    }
    try {
        const { rows } = await pool.query(`select usuario_id from transacoes where id = $1`,
            [idTransacao])

        if (rows.length === 1) {

            if (idUsuario === rows[0].usuario_id) {
                next()

            } else { res.status(404).json({ mensagem: 'Esta transação não pertence a este usuário.' }) }

        } else {
            res.status(404).json({ mensagem: 'Transação não encontrada.' })
        }
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' })
    }
}

const validarDadosParaCadastrarTransacao = async (req, res, next) => {
    const { descricao, valor, data, categoria_id, tipo } = req.body

    try {
        if (!descricao || !valor || !data || !categoria_id || !tipo) {
            return res.status(400).json({ "mensagem": "Todos os campos obrigatórios devem ser informados." })
        }

        const { rowCount } = await pool.query('select * from categorias where id = $1', [categoria_id])

        if (rowCount !== 1) {
            return res.status(404).json({ "mensagem": "A categoria com o ID especificado não foi encontrada." })
        }

        if (tipo === "entrada" || tipo === "saida") {
            next()
        } else {
            return res.status(400).json({ mensagem: 'O campo "tipo" deve ser "entrada" ou "saida" exatamente conforme especificado.' })
        }
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' })
    }
}

const validarDadosParaAtualizarTransacao = async (req, res, next) => {
    const { id: idUsuario } = req.usuario
    const { id: idTransacao } = req.params
    const { descricao, valor, data, categoria_id, tipo } = req.body

    try {
        const transacaoQuery = await pool.query(
            'select usuario_id from transacoes where id = $1',
            [idTransacao]
        )

        if (transacaoQuery.rows.length !== 1) {
            return res.status(404).json({ mensagem: 'Transação não encontrada.' })
        }

        if (transacaoQuery.rows[0].usuario_id !== idUsuario) {
            return res.status(403).json({ mensagem: 'Esta transação não pertence a este usuário.' })
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
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' })
    }

}



module.exports = {
    validarDadosParaCadastrarTransacao,
    validarDadosParaTransacoes,
    validarDadosParaAtualizarTransacao
}
