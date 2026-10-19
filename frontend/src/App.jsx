import { useCallback, useEffect, useState } from 'react'
import { api, definirAoExpirar, token } from './api.js'
import Autenticacao from './components/Autenticacao.jsx'
import Painel from './components/Painel.jsx'
import Transacoes from './components/Transacoes.jsx'
import Perfil from './components/Perfil.jsx'

const ABAS = [
  { id: 'painel', rotulo: 'Painel' },
  { id: 'transacoes', rotulo: 'Transações' },
  { id: 'perfil', rotulo: 'Conta' },
]

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(Boolean(token.ler()))
  const [aba, setAba] = useState('painel')
  const [aviso, setAviso] = useState('')

  const sair = useCallback((mensagem = '') => {
    token.limpar()
    setUsuario(null)
    setAviso(mensagem)
  }, [])

  useEffect(() => {
    definirAoExpirar(() => sair('Sua sessão expirou. Entre novamente.'))
    if (!token.ler()) return
    api
      .perfil()
      .then(setUsuario)
      .catch(() => token.limpar())
      .finally(() => setCarregando(false))
  }, [sair])

  const entrar = ({ usuario: u, token: t }) => {
    token.salvar(t)
    setUsuario(u)
    setAviso('')
    setAba('painel')
  }

  if (carregando) return <div className="tela-cheia">Carregando…</div>
  if (!usuario) return <Autenticacao aoEntrar={entrar} aviso={aviso} />

  return (
    <div className="app">
      <header className="topo">
        <div className="marca">
          <span className="logo">F</span> Financify
        </div>
        <nav className="abas">
          {ABAS.map((a) => (
            <button key={a.id} className={aba === a.id ? 'ativa' : ''} onClick={() => setAba(a.id)}>
              {a.rotulo}
            </button>
          ))}
        </nav>
        <div className="usuario">
          <span>{usuario.nome}</span>
          <button className="link" onClick={() => sair()}>
            Sair
          </button>
        </div>
      </header>
      <main className="conteudo">
        {aba === 'painel' && <Painel />}
        {aba === 'transacoes' && <Transacoes />}
        {aba === 'perfil' && <Perfil usuario={usuario} aoAtualizar={setUsuario} aoExcluir={() => sair('Conta excluída.')} />}
      </main>
    </div>
  )
}
