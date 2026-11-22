import { useCallback, useEffect, useRef, useState } from 'react'
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
  // ?demo no endereço (ex.: o link do portfólio) entra direto numa conta de demonstração.
  const [pediuDemo] = useState(() => new URLSearchParams(window.location.search).has('demo'))
  const [carregando, setCarregando] = useState(Boolean(token.ler()) || pediuDemo)
  const [modoInicial, setModoInicial] = useState('login')
  const demoPedida = useRef(false) // o StrictMode roda o efeito duas vezes em desenvolvimento
  const [aba, setAba] = useState('painel')
  const [aviso, setAviso] = useState('')

  const sair = useCallback((mensagem = '', modo = 'login') => {
    token.limpar()
    setUsuario(null)
    setAviso(mensagem)
    setModoInicial(modo)
  }, [])

  useEffect(() => {
    definirAoExpirar(() => sair('Sua sessão expirou. Entre novamente.'))
    if (pediuDemo) {
      const url = new URL(window.location.href)
      url.searchParams.delete('demo')
      window.history.replaceState(null, '', url)
    }
    if (!token.ler()) {
      if (!pediuDemo || demoPedida.current) return
      demoPedida.current = true
      api
        .demo()
        .then(({ usuario: u, token: t }) => {
          token.salvar(t)
          setUsuario(u)
        })
        .catch((erro) => setAviso(erro.message))
        .finally(() => setCarregando(false))
      return
    }
    api
      .perfil()
      .then(setUsuario)
      .catch(() => token.limpar())
      .finally(() => setCarregando(false))
  }, [sair, pediuDemo])

  const entrar = ({ usuario: u, token: t }) => {
    token.salvar(t)
    setUsuario(u)
    setAviso('')
    setAba('painel')
  }

  if (carregando) return <div className="tela-cheia">Carregando…</div>
  if (!usuario) return <Autenticacao key={modoInicial} aoEntrar={entrar} aviso={aviso} modoInicial={modoInicial} />

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
        {usuario.demo && (
          <div className="alerta info faixa-demo">
            <span>Conta de demonstração: os dados são de exemplo e esta conta é apagada em 24 horas.</span>
            <button className="link" onClick={() => sair('', 'cadastro')}>
              Criar minha conta
            </button>
          </div>
        )}
        {aba === 'painel' && <Painel />}
        {aba === 'transacoes' && <Transacoes />}
        {aba === 'perfil' && <Perfil usuario={usuario} aoAtualizar={setUsuario} aoExcluir={() => sair('Conta excluída.')} />}
      </main>
    </div>
  )
}
