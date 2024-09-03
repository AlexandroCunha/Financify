const pool = require('../connections/conexao')

const listarCategorias = async (req, res) => {
    try {
        const query = await pool.query('select * from categorias')

        return res.status(200).json(query.rows)
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao buscar categorias' })
    }
}


module.exports = {
    listarCategorias
}