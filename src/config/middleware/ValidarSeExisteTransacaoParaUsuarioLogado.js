const pool = require('../connections/conexao')

const validarTransacaoDoUsuario = async (req, res, next) => {
    const { id: idTransacao } = req.params
    const { id: idUsuario } = req.usuario

    if (!idTransacao) {
        return res.status(400).json({ mensagem: 'O Id é obrigatorio para encontrar uma transacao' })
    }
    try {
        const { rows } = await pool.query(`select usuario_id from transacoes where id = $1`,
            [idTransacao])

        if (rows.length === 1) {

            if (idUsuario === rows[0].usuario_id) {
                next()

            } else { res.status(404).json({ mensagem: 'Essa transação não existe' }) }

        } else {
            res.status(404).json({ mensagem: 'Transação não encontrada.' })
        }
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' })
    }
}
module.exports = validarTransacaoDoUsuario 