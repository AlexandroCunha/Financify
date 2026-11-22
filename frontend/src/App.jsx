import { useCallback, useEffect, useRef, useState } from 'react'
import { api, setOnExpired, token } from './api.js'
import Auth from './components/Auth.jsx'
import Dashboard from './components/Dashboard.jsx'
import Transactions from './components/Transactions.jsx'
import Account from './components/Account.jsx'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'account', label: 'Account' },
]

// The free API sleeps when idle; the first response can take about a minute.
function LoadingScreen() {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const wait = setTimeout(() => setSlow(true), 4000)
    return () => clearTimeout(wait)
  }, [])
  return (
    <div className="full-screen">
      <div className="loading" role="status">
        <p>Loading…</p>
        {slow && <small>Waking up the server. After a while without visits, this can take about 1 minute.</small>}
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  // ?demo in the address (e.g. the portfolio link) goes straight into a demo account.
  const [demoRequested] = useState(() => new URLSearchParams(window.location.search).has('demo'))
  const [loading, setLoading] = useState(Boolean(token.read()) || demoRequested)
  const [initialMode, setInitialMode] = useState('login')
  const demoStarted = useRef(false) // StrictMode runs effects twice in development
  const [tab, setTab] = useState('dashboard')
  const [openNew, setOpenNew] = useState(false)
  const [notice, setNotice] = useState('')

  const signOut = useCallback((message = '', mode = 'login') => {
    token.clear()
    setUser(null)
    setNotice(message)
    setInitialMode(mode)
  }, [])

  useEffect(() => {
    setOnExpired(() => signOut('Your session has expired. Please sign in again.'))
    if (demoRequested) {
      const url = new URL(window.location.href)
      url.searchParams.delete('demo')
      window.history.replaceState(null, '', url)
    }
    if (!token.read()) {
      if (!demoRequested || demoStarted.current) return
      demoStarted.current = true
      api
        .demo()
        .then(({ user: u, token: t }) => {
          token.save(t)
          setUser(u)
        })
        .catch((error) => setNotice(error.message))
        .finally(() => setLoading(false))
      return
    }
    api
      .profile()
      .then(setUser)
      .catch(() => token.clear())
      .finally(() => setLoading(false))
  }, [signOut, demoRequested])

  const goTo = (id, { newTransaction = false } = {}) => {
    setTab(id)
    setOpenNew(newTransaction)
  }

  const signIn = ({ user: u, token: t }) => {
    token.save(t)
    setUser(u)
    setNotice('')
    goTo('dashboard')
  }

  if (loading) return <LoadingScreen />
  if (!user) return <Auth key={initialMode} onSignIn={signIn} notice={notice} initialMode={initialMode} />

  return (
    <div className="app">
      <nav className="sidebar" aria-label="Main">
        <div className="brand">Financify</div>
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} aria-current={tab === t.id ? 'page' : undefined} onClick={() => goTo(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="user">
          <span className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
          <div className="user-text">
            <span className="name">{user.name}</span>
            <button className="link" onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </nav>
      <main className="content">
        {user.demo && (
          <div className="alert info demo-banner">
            <span>Demo account: the data is sample data and this account is deleted after 24 hours.</span>
            <button className="link" onClick={() => signOut('', 'signup')}>
              Create my account
            </button>
          </div>
        )}
        {tab === 'dashboard' && (
          <Dashboard onNewTransaction={() => goTo('transactions', { newTransaction: true })} onSeeTransactions={() => goTo('transactions')} />
        )}
        {tab === 'transactions' && <Transactions openNew={openNew} />}
        {tab === 'account' && <Account user={user} onUpdate={setUser} onDelete={() => signOut('Account deleted.')} />}
      </main>
    </div>
  )
}
