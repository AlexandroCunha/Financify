const pool = require('../connections/conexao')

const validarTransacaoDoUsuario = async (req, res, next) => {
    const { id: idTransacao } = req.params

    try {
        const query = await pool.query(`
            SELECT usuario_id
            FROM transacoes
            WHERE id = $1
        `, [idTransacao])

        if (query.rows.length === 1) {
            next()
        } else {
            res.status(404).json({ mensagem: 'Transação não encontrada.' })
        }
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' })
    }
}
module.exports = validarTransacaoDoUsuario