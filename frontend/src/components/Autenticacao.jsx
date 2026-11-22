import { useState } from 'react'
import { api } from '../api.js'

export default function Autenticacao({ aoEntrar, aviso, modoInicial = 'login' }) {
  const [modo, setModo] = useState(modoInicial)
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

  async function entrarNaDemo() {
    setErro('')
    setErros({})
    setEnviando(true)
    try {
      aoEntrar(await api.demo())
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const trocar = () => {
    setModo(modo === 'login' ? 'cadastro' : 'login')
    setErro('')
    setErros({})
  }

  return (
    <div className="tela-cheia">
      <form className="cartao auth" onSubmit={enviar}>
        <div className="marca grande">
          <span className="logo">F</span> Financify
        </div>
        <p className="sub">{modo === 'login' ? 'Entre para ver suas finanças.' : 'Crie sua conta gratuita.'}</p>
        {aviso && <div className="alerta info">{aviso}</div>}
        {erro && <div className="alerta erro">{erro}</div>}

        {modo === 'cadastro' && (
          <label>
            Nome
            <input required maxLength={100} autoComplete="name" {...campo('nome')} />
            {erros.nome && <small className="erro-campo">{erros.nome}</small>}
          </label>
        )}
        <label>
          E-mail
          <input type="email" required autoComplete="email" {...campo('email')} />
          {erros.email && <small className="erro-campo">{erros.email}</small>}
        </label>
        <label>
          Senha
          <input
            type="password"
            required
            autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
            {...campo('senha')}
          />
          {erros.senha && <small className="erro-campo">{erros.senha}</small>}
        </label>

        <button className="primario" disabled={enviando}>
          {enviando ? 'Aguarde…' : modo === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
        <button type="button" className="link centro" onClick={trocar}>
          {modo === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
        </button>

        {modo === 'login' && (
          <div className="demo">
            <button type="button" className="secundario" onClick={entrarNaDemo} disabled={enviando}>
              Ver demonstração
            </button>
            <small>Entra numa conta com dados de exemplo, sem cadastro. Ela é apagada em 24 horas.</small>
          </div>
        )}
      </form>
    </div>
  )
}
