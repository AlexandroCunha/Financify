const pool = require('../connections/conexao')
const bcrypt = require('bcrypt')

const validarDadosParaCadastrarUsuario = async (req, res, next) => {
    const { nome, senha, email } = req.body

    try {
        if (!nome || !email || !senha) {
            return res.status(400).json({ mensagem: 'Todos os campos (nome, email e senha) são obrigatórios.' });
        }

        const emailExiste = await pool.query('select * from usuarios where email = $1', [email])

        if (emailExiste.rowCount > 0) {
            return res.status(400).json({ mensagem: 'O e-mail informado já está em uso.' })
        }
        next()
    } catch (error) {
        return res.status(500).json({ mensagem: 'erro interno do servidor' })
    }

}

const validarDadosParaAtualizarUsuario = async (req, res, next) => {
    const { nome, email, senha } = req.body
    const { id: usuarioLogado } = req.usuario

    try {
        if (!nome || !email || !senha) {
            return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios.' })
        }

        if (senha) {
            req.senhaCriptografada = await bcrypt.hash(senha, 10)
        }

        if (email) {
            const { rowCount, rows } = await pool.query("select * from usuarios where email = $1", [email])

            if (rowCount === 1 && rows[0].id !== usuarioLogado) {
                return res.status(400).json({ mensagem: 'O e-mail informado já está sendo utilizado.' })
            }
        }
        next()
    } catch (error) {
        return res.status(500).json({ mensagem: 'erro interno do servidor' })
    }

}

const validarDadosParaLogin = async (req, res, next) => {
    const { email, senha } = req.body

    try {
        if (!email || !senha) {
            return res.status(404).json({ mensagem: 'Todos os campos são obrigatórios' })
        }

        const { rows, rowCount } = await pool.query('select * from usuarios where email = $1', [email])

        if (rowCount === 0) {
            return res.status(400).json({ mensagem: 'Email não encontrado' })
        }

        const { senha: senhaUsuario } = rows[0]

        const senhaCorreta = await bcrypt.compare(senha, senhaUsuario)

        if (!senhaCorreta) {
            return res.status(400).json({ mensagem: 'Senha incorreta' })
        }
        next()

    } catch (error) {
        return res.status(500).json({ mensagem: 'erro interno do servidor' })
    }
}

module.exports = {
    validarDadosParaCadastrarUsuario,
    validarDadosParaAtualizarUsuario,
    validarDadosParaLogin
}