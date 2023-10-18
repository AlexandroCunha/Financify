const pool = require('../connections/conexao')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const senhajwt = require('../jwtkey')

const cadastrarUsuario = async (req, res) => {
    const { nome, senha, email } = req.body

    try {
        const emailExiste = await pool.query('select * from usuarios where email = $1', [email])

        if (emailExiste.rowCount > 0) {
            return res.status(400).json({ mensagem: 'Email ja existe' })
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10)

        const query = `insert into usuarios(nome, email, senha) values($1, $2, $3) returning *`

        const { rows } = await pool.query(query, [nome, email, senhaCriptografada])

        const { senha: _, ...usuario } = rows[0]

        return res.status(201).json(usuario)
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}

const login = async (req, res) => {
    const { email, senha } = req.body

    if (!email || !senha) {
        return res.status(404).json({ mensagem: 'Todos os campos são obrigatórios' })
    }

    try {
        const { rows, rowCount } = await pool.query('select * from usuarios where email = $1', [email])

        if (rowCount === 0) {
            return res.status(400).json({ mensagem: 'Email não encontrado' })
        }

        const { senha: senhaUsuario, ...usuario } = rows[0]

        const senhaCorreta = await bcrypt.compare(senha, senhaUsuario)

        if (!senhaCorreta) {
            return res.status(400).json({ mensagem: 'Senha inválida' })
        }

        const token = jwt.sign({ id: usuario.id }, senhajwt, { expiresIn: '8h' })

        return res.json({
            usuario,
            token,
        })
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}

module.exports = {
    cadastrarUsuario,
    login
}