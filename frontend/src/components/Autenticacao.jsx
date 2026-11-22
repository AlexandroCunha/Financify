import { useState } from 'react'
import { api } from '../api.js'

export default function Autenticacao({ aoEntrar, aviso }) {
  const [modo, setModo] = useState('login')
  const [form, setForm] = useState({ nome: '', email: '', senha: '' })
  const [erro, setErro] = useState('')
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)

  const campo = (nome) => ({
    value: form[nome],
    onChange: (e) => setForm({ ...form, [nome]: e.target.value }),
  })

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    setErros({})
    setEnviando(true)
    try {
      if (modo === 'cadastro') await api.cadastrar(form)
      aoEntrar(await api.login({ email: form.email, senha: form.senha }))
    } catch (err) {
      setErro(err.message)
      setErros(err.erros)
    } finally {
      setEnviando(false)
    }
  }

  const trocar = () => {
    setModo(modo === 'login' ? 'cadastro' : 'login')
    setErro('')
    setErros({})
  }

  const entrando = modo === 'login'
  const barras = [[62, 48], [62, 42], [66, 52], [62, 41], [70, 50], [62, 45], [62, 55], [68, 44]]

  return (
    <div className="entrada-tela">
      <section className="entrada-marca">
        <div className="marca grande">Financify</div>
        <div>
          <h1>Para onde vai cada euro, mês a mês</h1>
          <p>Registre entradas e saídas, filtre por categoria e acompanhe o saldo de cada mês.</p>
          <div className="entrada-barras" aria-hidden="true">
            {barras.map(([e, s], i) => (
              <div key={i}>
                <i className="entrada" style={{ height: `${e}%` }} />
                <i className="saida" style={{ height: `${s}%` }} />
              </div>
            ))}
          </div>
        </div>
        <small>Valores em euro (€)</small>
      </section>

      <section className="entrada-form">
        <form className="auth" onSubmit={enviar}>
          <div className="abas-pilula" role="group" aria-label="Acesso">
            <button type="button" aria-pressed={entrando} onClick={() => !entrando && trocar()}>Entrar</button>
            <button type="button" aria-pressed={!entrando} onClick={() => entrando && trocar()}>Criar conta</button>
          </div>
          <h2 className="titulo-modal">{entrando ? 'Entre na sua conta' : 'Crie sua conta'}</h2>
          {aviso && <div className="alerta info">{aviso}</div>}
          {erro && <div className="alerta erro">{erro}</div>}

          {!entrando && (
            <label>
              Nome
              <input required maxLength={100} autoComplete="name" {...campo('nome')} />
              {erros.nome && <small className="erro-campo">{erros.nome}</small>}
            </label>
          )}
          <label>
            E-mail
            <input type="email" required autoComplete="email" placeholder="nome@exemplo.com" {...campo('email')} />
            {erros.email && <small className="erro-campo">{erros.email}</small>}
          </label>
          <label>
            Senha
            <input
              type="password"
              required
              autoComplete={entrando ? 'current-password' : 'new-password'}
              {...campo('senha')}
            />
            {erros.senha && <small className="erro-campo">{erros.senha}</small>}
          </label>

          <button className="primario" disabled={enviando}>
            {enviando ? 'Aguarde…' : entrando ? 'Entrar' : 'Criar conta'}
          </button>
          <p className="troca">
            {entrando ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
            <button type="button" className="link" onClick={trocar}>{entrando ? 'Criar conta' : 'Entrar'}</button>
          </p>
        </form>
      </section>
    </div>
  )
}
