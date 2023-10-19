const pool = require('../conexao')
const jwt = require('jsonwebtoken')
const jwtkey = require('../config/jwtkey')

const obterUsuarioLogado = async (req, res, next) => {
    const { authorization } = req.headers

    const token = authorization.split(' ')[1]

    try {
        const { id } = jwt.verify(token, jwtkey)

        const { rows, rowCount } = await pool.query(
            'select * from usuarios where id = $1',
            [id]
        )

        if (rowCount < 1) {
            return res.status(401).json({ mensagem: 'Para acessar este recurso um token de autenticação válido deve ser enviado.' })
        }

        req.usuario = rows[0]
        next()
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
    }
}

module.exports = obterUsuarioLogado
