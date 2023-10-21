const pool = require('../connections/conexao')
const bcrypt = require('bcrypt')

const validarDadosParaAtualizarUsuario = async (req, res, next) => {
    const { nome, email, senha } = req.body

    if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios.' })
    }

    if (senha) {
        req.senhaCriptografada = await bcrypt.hash(senha, 10)
    }

    try {
        if (email) {
            const emailExiste = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email])

            if (emailExiste.rowCount === 1) {
                return res.status(400).json({ mensagem: 'O e-mail informado já está sendo utilizado.' })
            }
        }
    } catch (error) {
        return res.status(500).json({ mensagem: 'erro interno do servidor' })
    }

    next()
};
module.exports = validarDadosParaAtualizarUsuario
