const pool = require('../connections/conexao')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const jwtkey = require('../secret/jwtkey')

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

        const token = jwt.sign({ id: usuario.id }, jwtkey, { expiresIn: '30d' })

        return res.json({
            usuario,
            token,
        })
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor' })
    }
}

const detalharUsuario = async (req, res) => {
    const { senha, ...usuario } = req.usuario
    return res.json(usuario)
}

const atualizarUsuario = async (req, res) => {
    const { nome, email, senha } = req.body
    const { id, nome: nomeUsuario, email: emailUsuario, senha: senhaUsuario } = req.usuario;

    if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios.' })
    }

    if (senha) {
        senhaCriptografada = await bcrypt.hash(senha, 10)
    }

    try {
        const query = 'UPDATE usuarios SET nome = $1, email = $2, senha = $3 WHERE id = $4';
        await pool.query(query, [nome, email, senhaCriptografada, id])

        return res.status(204).send()
    } catch (error) {
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' })
    }
}


module.exports = {
    cadastrarUsuario,
    login,
    detalharUsuario,
    atualizarUsuario
}