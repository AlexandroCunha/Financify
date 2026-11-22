import { useState } from 'react'
import { api } from '../api.js'
import ConfirmDialog from './ConfirmDialog.jsx'

function useSubmit() {
  const [state, setState] = useState({ error: '', errors: {}, ok: '' })
  const run = async (fn, okMessage) => {
    setState({ error: '', errors: {}, ok: '' })
    try {
      await fn()
      setState({ error: '', errors: {}, ok: okMessage })
      return true
    } catch (e) {
      setState({ error: e.message, errors: e.errors, ok: '' })
      return false
    }
  }
  return [state, run]
}

function Messages({ state }) {
  return (
    <>
      {state.error && <div className="alert error">{state.error}</div>}
      {state.ok && <div className="alert ok">{state.ok}</div>}
    </>
  )
}

export default function Account({ user, onUpdate, onDelete }) {
  const [details, setDetails] = useState({ name: user.name, email: user.email })
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '' })
  const [detailsState, submitDetails] = useSubmit()
  const [passwordState, submitPassword] = useSubmit()
  const [accountState, submitAccount] = useSubmit()
  const [confirming, setConfirming] = useState(false)

  async function saveDetails(e) {
    e.preventDefault()
    // In a demo account only the name can change.
    const body = user.demo ? { name: details.name } : details
    await submitDetails(async () => onUpdate(await api.updateProfile(body)), 'Details saved.')
  }

  async function savePassword(e) {
    e.preventDefault()
    const ok = await submitPassword(() => api.changePassword(passwords), 'Password changed.')
    if (ok) setPasswords({ current_password: '', new_password: '' })
  }

  async function deleteAccount() {
    const ok = await submitAccount(() => api.deleteAccount(), '')
    setConfirming(false)
    if (ok) onDelete()
  }

  return (
    <div className="account">
      <h1 className="page-title">Account</h1>
      <form className="card" onSubmit={saveDetails}>
        <h2>Your details</h2>
        <p className="description">{user.demo ? 'In a demo account only the name can change.' : 'Your e-mail is what you use to sign in.'}</p>
        <Messages state={detailsState} />
        <label>
          Name
          <input required maxLength={100} value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
          {detailsState.errors.name && <small className="field-error">{detailsState.errors.name}</small>}
        </label>
        {!user.demo && (
          <label>
            E-mail
            <input type="email" required value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} />
            {detailsState.errors.email && <small className="field-error">{detailsState.errors.email}</small>}
          </label>
        )}
        <button className="primary">Save changes</button>
      </form>

      {!user.demo && (
        <form className="card" onSubmit={savePassword}>
          <h2>Password</h2>
          <p className="description">Use at least 8 characters.</p>
          <Messages state={passwordState} />
          <label>
            Current password
            <input type="password" required autoComplete="current-password" value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} />
            {passwordState.errors.current_password && <small className="field-error">{passwordState.errors.current_password}</small>}
          </label>
          <label>
            New password
            <input type="password" required autoComplete="new-password" value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} />
            {passwordState.errors.new_password && <small className="field-error">{passwordState.errors.new_password}</small>}
          </label>
          <button className="primary">Change password</button>
        </form>
      )}

      <section className="card danger-zone">
        <h2>Delete account</h2>
        <p className="description">This deletes your account and all your transactions. It cannot be undone.</p>
        <Messages state={accountState} />
        <button className="danger-solid" onClick={() => setConfirming(true)}>Delete my account</button>
      </section>

      {confirming && (
        <ConfirmDialog
          title="Delete your account?"
          text="Your account and all your transactions will be deleted. This cannot be undone."
          confirmLabel="Delete account"
          danger
          onConfirm={deleteAccount}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}
