import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { categoriesOfType } from '../categories.js'
import { amountToCents, centsToText, today } from '../format.js'

export default function TransactionForm({ transaction, categories, onSave, onCancel }) {
  const initialType = transaction?.type ?? 'expense'
  const [form, setForm] = useState({
    type: initialType,
    description: transaction?.description ?? '',
    amount: transaction ? centsToText(transaction.amount) : '',
    date: transaction?.date.slice(0, 10) ?? today(),
    category_id: transaction?.category_id ?? categoriesOfType(categories, initialType)[0]?.id ?? '',
  })
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const change = (name) => (e) => setForm({ ...form, [name]: e.target.value })

  // Only the categories of the chosen type; when editing, the current category stays available.
  const options = categoriesOfType(categories, form.type)
  const current = categories.find((c) => String(c.id) === String(form.category_id))
  if (current && !options.includes(current)) options.push(current)

  function chooseType(type) {
    if (type === form.type) return
    const valid = categoriesOfType(categories, type)
    const keep = valid.some((c) => String(c.id) === String(form.category_id))
    setForm({ ...form, type, category_id: keep ? form.category_id : (valid[0]?.id ?? '') })
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setErrors({})
    const amount = amountToCents(form.amount)
    if (!Number.isInteger(amount) || amount < 1) {
      setErrors({ amount: 'Enter an amount greater than zero, such as 10.50.' })
      return
    }
    const body = { ...form, amount, category_id: Number(form.category_id) }
    setBusy(true)
    try {
      if (transaction) await api.updateTransaction(transaction.id, body)
      else await api.createTransaction(body)
      onSave()
    } catch (err) {
      setError(err.message)
      setErrors(err.errors)
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="card modal wide" role="dialog" aria-modal="true" aria-labelledby="form-title" onSubmit={submit}>
        <h2 id="form-title" className="modal-title">{transaction ? 'Edit transaction' : 'New transaction'}</h2>
        {error && <div className="alert error">{error}</div>}

        <div className="toggle" role="group" aria-label="Type">
          {['expense', 'income'].map((t) => (
            <button type="button" key={t} aria-pressed={form.type === t} className={form.type === t ? `selected ${t}` : ''} onClick={() => chooseType(t)}>
              {t === 'expense' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>

        <label>
          Description
          <input required maxLength={255} placeholder="Supermarket" value={form.description} onChange={change('description')} />
          {errors.description && <small className="field-error">{errors.description}</small>}
        </label>
        <div className="two-columns">
          <label>
            Amount (€)
            <input required inputMode="decimal" placeholder="0.00" value={form.amount} onChange={change('amount')} />
            {errors.amount && <small className="field-error">{errors.amount}</small>}
          </label>
          <label>
            Date
            <input type="date" required value={form.date} onChange={change('date')} />
            {errors.date && <small className="field-error">{errors.date}</small>}
          </label>
        </div>

        <fieldset className="category-chips">
          <legend>Category</legend>
          <div>
            {options.map((c) => (
              <label key={c.id} className="chip">
                <input
                  type="radio"
                  name="category"
                  value={c.id}
                  checked={String(form.category_id) === String(c.id)}
                  onChange={() => setForm({ ...form, category_id: c.id })}
                />
                <span>{c.name}</span>
              </label>
            ))}
          </div>
          {errors.category_id && <small className="field-error">{errors.category_id}</small>}
        </fieldset>

        <div className="actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  )
}
