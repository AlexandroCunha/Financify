import { useState } from 'react'
import { api } from '../api.js'

export default function Auth({ onSignIn, notice, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const field = (name) => ({
    value: form[name],
    onChange: (e) => setForm({ ...form, [name]: e.target.value }),
  })

  async function submit(e) {
    e.preventDefault()
    setError('')
    setErrors({})
    setBusy(true)
    try {
      if (mode === 'signup') await api.signUp(form)
      onSignIn(await api.login({ email: form.email, password: form.password }))
    } catch (err) {
      setError(err.message)
      setErrors(err.errors)
    } finally {
      setBusy(false)
    }
  }

  async function tryDemo() {
    setError('')
    setErrors({})
    setBusy(true)
    try {
      onSignIn(await api.demo())
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError('')
    setErrors({})
  }

  const signingIn = mode === 'login'
  const bars = [[62, 48], [62, 42], [66, 52], [62, 41], [70, 50], [62, 45], [62, 55], [68, 44]]

  return (
    <div className="auth-screen">
      <section className="auth-brand">
        <div className="brand large">Financify</div>
        <div>
          <h1>Where every euro goes, month by month</h1>
          <p>Record income and expenses, filter by category and follow the balance of every month.</p>
          <div className="auth-bars" aria-hidden="true">
            {bars.map(([income, expense], i) => (
              <div key={i}>
                <i className="income" style={{ height: `${income}%` }} />
                <i className="expense" style={{ height: `${expense}%` }} />
              </div>
            ))}
          </div>
        </div>
        <small>Amounts in euro (€)</small>
      </section>

      <section className="auth-form">
        <form className="auth" onSubmit={submit}>
          <div className="pill-tabs" role="group" aria-label="Access">
            <button type="button" aria-pressed={signingIn} onClick={() => !signingIn && switchMode()}>Sign in</button>
            <button type="button" aria-pressed={!signingIn} onClick={() => signingIn && switchMode()}>Create account</button>
          </div>
          <h2 className="modal-title">{signingIn ? 'Sign in to your account' : 'Create your account'}</h2>
          {notice && <div className="alert info">{notice}</div>}
          {error && <div className="alert error">{error}</div>}

          {!signingIn && (
            <label>
              Name
              <input required maxLength={100} autoComplete="name" {...field('name')} />
              {errors.name && <small className="field-error">{errors.name}</small>}
            </label>
          )}
          <label>
            E-mail
            <input type="email" required autoComplete="email" placeholder="name@example.com" {...field('email')} />
            {errors.email && <small className="field-error">{errors.email}</small>}
          </label>
          <label>
            Password
            <input type="password" required autoComplete={signingIn ? 'current-password' : 'new-password'} {...field('password')} />
            {errors.password && <small className="field-error">{errors.password}</small>}
          </label>

          <button className="primary" disabled={busy}>
            {busy ? 'Please wait…' : signingIn ? 'Sign in' : 'Create account'}
          </button>
          <p className="switch">
            {signingIn ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button type="button" className="link" onClick={switchMode}>{signingIn ? 'Create one' : 'Sign in'}</button>
          </p>

          {signingIn && (
            <div className="demo">
              <button type="button" className="secondary" onClick={tryDemo} disabled={busy}>
                Try the demo
              </button>
              <small>Opens an account with sample data, no sign-up needed. It is deleted after 24 hours.</small>
            </div>
          )}
        </form>
      </section>
    </div>
  )
}
