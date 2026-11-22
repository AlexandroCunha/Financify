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

// A API gratuita dorme quando fica parada; a primeira resposta pode levar cerca de um minuto.
function TelaCarregando() {
  const [demora, setDemora] = useState(false)
  useEffect(() => {
    const espera = setTimeout(() => setDemora(true), 4000)
    return () => clearTimeout(espera)
  }, [])
  return (
    <div className="tela-cheia">
      <div className="carregando" role="status">
        <p>Carregando…</p>
        {demora && <small>Acordando o servidor. Na primeira visita depois de um tempo parado, isso pode levar cerca de 1 minuto.</small>}
      </div>
    </div>
  )
}

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(Boolean(token.ler()))
  const [aba, setAba] = useState('painel')
  const [abrirNova, setAbrirNova] = useState(false)
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

  const irPara = (id, { nova = false } = {}) => {
    setAba(id)
    setAbrirNova(nova)
  }

  const entrar = ({ usuario: u, token: t }) => {
    token.salvar(t)
    setUsuario(u)
    setAviso('')
    irPara('painel')
  }

  if (carregando) return <TelaCarregando />
  if (!usuario) return <Autenticacao aoEntrar={entrar} aviso={aviso} />

  return (
    <div className="app">
      <nav className="lateral" aria-label="Principal">
        <div className="marca">Financify</div>
        <div className="abas">
          {ABAS.map((a) => (
            <button key={a.id} className={aba === a.id ? 'ativa' : ''} aria-current={aba === a.id ? 'page' : undefined} onClick={() => irPara(a.id)}>
              {a.rotulo}
            </button>
          ))}
        </div>
        <div className="usuario">
          <span className="avatar" aria-hidden="true">{usuario.nome.charAt(0).toUpperCase()}</span>
          <span className="nome">{usuario.nome}</span>
          <button className="link" onClick={() => sair()}>
            Sair
          </button>
        </div>
      </nav>
      <main className="conteudo">
        {aba === 'painel' && (
          <Painel aoNovaTransacao={() => irPara('transacoes', { nova: true })} aoVerTransacoes={() => irPara('transacoes')} />
        )}
        {aba === 'transacoes' && <Transacoes abrirNova={abrirNova} />}
        {aba === 'perfil' && <Perfil usuario={usuario} aoAtualizar={setUsuario} aoExcluir={() => sair('Conta excluída.')} />}
      </main>
    </div>
  )
}
