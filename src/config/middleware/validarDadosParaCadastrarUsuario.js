const pool = require('../connections/conexao')

const validarDadosParaCadastrarUsuario = async (req, res, next) => {
    const { descricao, valor, data, categoria_id, tipo } = req.body

    try {
        if (!descricao || !valor || !data || !categoria_id || !tipo) {
            return res.status(400).json({ "mensagem": "Todos os campos obrigatórios devem ser informados." })
        }

        const { rowCount } = await pool.query('select * from categorias where id = $1', [categoria_id])

        if (rowCount !== 1) {
            return res.status(404).json({ "mensagem": "Categoria_id não encontrada." })
        }

        if (tipo === "entrada" || tipo === "saida") {
            next()
        } else {
            return res.status(400).json({ mensagem: 'O campo "tipo" deve ser "entrada" ou "saida" exatamente como descrito.' })
        }
    } catch (error) {
        return res.status(500).json({ mensagem: 'erro interno do servidor' })
    }

}
module.exports = validarDadosParaCadastrarUsuario