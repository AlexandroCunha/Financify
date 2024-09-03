const pool = require('../connections/conexao')
const jwt = require('jsonwebtoken')
const jwtkey = require('../secret/jwtkey')

const validarLogin = async (req, res, next) => {
    const { authorization } = req.headers

    if (!authorization) {
        return res.status(401).json({ mensage: 'Não autorizado' })
    }

    const token = authorization.split(' ')[1]

    try {
        const { id } = jwt.verify(token, jwtkey)

        const { rows, rowCount } = await pool.query('select * from usuarios where id = $1', [id])

        if (rowCount === 0) {
            return res.status(401).json({ mensage: 'Não autorizado' })
        }

        req.usuario = rows[0]

        next()
    } catch (error) {
        return res.status(401).json({ mensagem: 'Erro interno do servidor' })
    }
}


module.exports = validarLogin


