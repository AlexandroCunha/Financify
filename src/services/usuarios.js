const bcrypt = require('bcrypt')
const usuarios = require('../repositories/usuarios')
const { conflito, naoEncontrado, requisicaoInvalida } = require('../utils/erros')

const CUSTO_DO_HASH = 10

const emailJaUsado = (erro) => erro.code === '23505' && erro.constraint === 'usuarios_email_key'

async function cadastrar({ nome, email, senha }) {
  const senhaHash = await bcrypt.hash(senha, CUSTO_DO_HASH)
  try {
    return await usuarios.criar({ nome, email, senhaHash })
  } catch (erro) {
    if (emailJaUsado(erro)) throw conflito('Já existe uma conta com este e-mail.')
    throw erro
  }
}

async function atualizarPerfil(id, dados) {
  let usuario
  try {
    usuario = await usuarios.atualizar(id, dados)
  } catch (erro) {
    if (emailJaUsado(erro)) throw conflito('Já existe uma conta com este e-mail.')
    throw erro
  }
  if (!usuario) throw naoEncontrado('Usuário não encontrado.')
  return usuario
}

async function alterarSenha(id, { senha_atual, nova_senha }) {
  const hashAtual = await usuarios.buscarSenha(id)
  const confere = hashAtual !== null && (await bcrypt.compare(senha_atual, hashAtual))
  if (!confere) throw requisicaoInvalida({ senha_atual: 'está incorreta' }, 'A senha atual está incorreta.')
  await usuarios.atualizarSenha(id, await bcrypt.hash(nova_senha, CUSTO_DO_HASH))
}

async function excluirConta(id) {
  await usuarios.excluir(id)
}

module.exports = { cadastrar, atualizarPerfil, alterarSenha, excluirConta }
