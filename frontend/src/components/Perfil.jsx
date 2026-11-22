import { useState } from 'react'
import { api } from '../api.js'
import Confirmar from './Confirmar.jsx'

function useEnvio() {
  const [estado, setEstado] = useState({ erro: '', erros: {}, ok: '' })
  const executar = async (fn, mensagemOk) => {
    setEstado({ erro: '', erros: {}, ok: '' })
    try {
      await fn()
      setEstado({ erro: '', erros: {}, ok: mensagemOk })
      return true
    } catch (e) {
      setEstado({ erro: e.message, erros: e.erros, ok: '' })
      return false
    }
  }
  return [estado, executar]
}

function Mensagens({ estado }) {
  return (
    <>
      {estado.erro && <div className="alerta erro">{estado.erro}</div>}
      {estado.ok && <div className="alerta ok">{estado.ok}</div>}
    </>
  )
}

export default function Perfil({ usuario, aoAtualizar, aoExcluir }) {
  const [dados, setDados] = useState({ nome: usuario.nome, email: usuario.email })
  const [senhas, setSenhas] = useState({ senha_atual: '', nova_senha: '' })
  const [estadoDados, enviarDados] = useEnvio()
  const [estadoSenha, enviarSenha] = useEnvio()
  const [estadoConta, enviarConta] = useEnvio()
  const [confirmando, setConfirmando] = useState(false)

  async function salvarDados(e) {
    e.preventDefault()
    await enviarDados(async () => aoAtualizar(await api.atualizarPerfil(dados)), 'Dados atualizados.')
  }

  async function salvarSenha(e) {
    e.preventDefault()
    const ok = await enviarSenha(() => api.alterarSenha(senhas), 'Senha alterada.')
    if (ok) setSenhas({ senha_atual: '', nova_senha: '' })
  }

  async function excluir() {
    const ok = await enviarConta(() => api.excluirConta(), '')
    setConfirmando(false)
    if (ok) aoExcluir()
  }

  return (
    <div className="perfil">
      <h1 className="titulo-pagina">Conta</h1>
      <form className="cartao" onSubmit={salvarDados}>
        <h2>Seus dados</h2>
        <p className="descricao">O e-mail é o que você usa para entrar.</p>
        <Mensagens estado={estadoDados} />
        <label>
          Nome
          <input required maxLength={100} value={dados.nome} onChange={(e) => setDados({ ...dados, nome: e.target.value })} />
          {estadoDados.erros.nome && <small className="erro-campo">{estadoDados.erros.nome}</small>}
        </label>
        <label>
          E-mail
          <input type="email" required value={dados.email} onChange={(e) => setDados({ ...dados, email: e.target.value })} />
          {estadoDados.erros.email && <small className="erro-campo">{estadoDados.erros.email}</small>}
        </label>
        <button className="primario">Salvar alterações</button>
      </form>

      <form className="cartao" onSubmit={salvarSenha}>
        <h2>Senha</h2>
        <p className="descricao">Use pelo menos 8 caracteres.</p>
        <Mensagens estado={estadoSenha} />
        <label>
          Senha atual
          <input type="password" required autoComplete="current-password" value={senhas.senha_atual} onChange={(e) => setSenhas({ ...senhas, senha_atual: e.target.value })} />
        </label>
        <label>
          Nova senha
          <input type="password" required autoComplete="new-password" value={senhas.nova_senha} onChange={(e) => setSenhas({ ...senhas, nova_senha: e.target.value })} />
          {estadoSenha.erros.nova_senha && <small className="erro-campo">{estadoSenha.erros.nova_senha}</small>}
        </label>
        <button className="primario">Trocar senha</button>
      </form>

      <section className="cartao zona-perigo">
        <h2>Excluir conta</h2>
        <p className="descricao">Isso apaga sua conta e todas as suas transações. Não dá para desfazer.</p>
        <Mensagens estado={estadoConta} />
        <button className="perigo-solido" onClick={() => setConfirmando(true)}>Excluir minha conta</button>
      </section>

      {confirmando && (
        <Confirmar
          titulo="Excluir sua conta?"
          texto="Sua conta e todas as suas transações serão apagadas. Não dá para desfazer."
          rotuloConfirmar="Excluir conta"
          perigo
          aoConfirmar={excluir}
          aoCancelar={() => setConfirmando(false)}
        />
      )}
    </div>
  )
}
