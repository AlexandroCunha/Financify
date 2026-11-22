import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'
import { categoryColour } from '../categories.js'
import { dayLabel, formatCurrency } from '../format.js'
import ConfirmDialog from './ConfirmDialog.jsx'
import TransactionForm from './TransactionForm.jsx'

const NO_FILTERS = { type: '', category_id: '', from: '', to: '' }
const PER_PAGE = 10

// The list already comes sorted; this groups consecutive transactions from the same day.
function groupByDay(transactions) {
  const groups = []
  for (const t of transactions) {
    const day = t.date.slice(0, 10)
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.items.push(t)
    else groups.push({ day, items: [t] })
  }
  return groups
}

export default function Transactions({ openNew = false }) {
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState(NO_FILTERS)
  const [order, setOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [period, setPeriod] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(openNew ? {} : null) // null | {} (new) | a transaction
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    api.categories().then(setCategories).catch((e) => setError(e.message))
  }, [])

  const load = useCallback(() => {
    setError('')
    api
      .transactions({ ...filters, page, order, limit: PER_PAGE })
      .then(setData)
      .catch((e) => setError(e.message))
  }, [filters, page, order])

  useEffect(load, [load])

  // The statement only filters by period; with a type or category filter, its totals would not match the list.
  const filteringByTypeOrCategory = Boolean(filters.type || filters.category_id)
  const reloadPeriod = useCallback(() => {
    if (filteringByTypeOrCategory) return setPeriod(null)
    api
      .statement({ from: filters.from, to: filters.to })
      .then(setPeriod)
      .catch(() => setPeriod(null))
  }, [filters.from, filters.to, filteringByTypeOrCategory])

  useEffect(reloadPeriod, [reloadPeriod])

  const refresh = () => {
    load()
    reloadPeriod()
  }

  const changeFilter = (name) => (e) => {
    setFilters({ ...filters, [name]: e.target.value })
    setPage(1)
  }

  async function confirmDelete() {
    setDeleteBusy(true)
    try {
      await api.deleteTransaction(deleting.id)
      setDeleting(null)
      refresh()
    } catch (e) {
      setDeleting(null)
      setError(e.message)
    } finally {
      setDeleteBusy(false)
    }
  }

  const saved = () => {
    setEditing(null)
    refresh()
  }

  const total = period ? period.income + period.expenses : 0

  return (
    <>
      <div className="title-row">
        <h1 className="page-title">Transactions</h1>
        <button className="primary" onClick={() => setEditing({})}>New transaction</button>
      </div>

      <section className="card filters">
        <label>
          Type
          <select value={filters.type} onChange={changeFilter('type')}>
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>
        </label>
        <label>
          Category
          <select value={filters.category_id} onChange={changeFilter('category_id')}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>
          From
          <input type="date" value={filters.from} onChange={changeFilter('from')} />
        </label>
        <label>
          To
          <input type="date" value={filters.to} onChange={changeFilter('to')} />
        </label>
        <label>
          Order
          <select value={order} onChange={(e) => setOrder(e.target.value)}>
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </label>
        <button className="link" onClick={() => { setFilters(NO_FILTERS); setPage(1) }}>Clear filters</button>
      </section>

      {error && <div className="alert error">{error}</div>}

      {period && total > 0 && (
        <section className="card period-summary">
          <div className="summary-row">
            <span>Income <strong className="positive">+{formatCurrency(period.income)}</strong></span>
            {data && <small>{data.pagination.total} transactions</small>}
            <span>Expenses <strong className="negative">−{formatCurrency(period.expenses)}</strong></span>
          </div>
          <div
            className="ratio"
            role="img"
            aria-label={`Income is ${Math.round((period.income / total) * 100)}% and expenses ${Math.round((period.expenses / total) * 100)}% of the money moved in the period.`}
          >
            <div className="bar income" style={{ width: `${(period.income / total) * 100}%` }} />
            <div className="bar expense" style={{ width: `${(period.expenses / total) * 100}%` }} />
          </div>
        </section>
      )}

      <section className="card list">
        {!data ? (
          <p className="empty">Loading…</p>
        ) : data.transactions.length === 0 ? (
          <p className="empty">No transactions match these filters.</p>
        ) : (
          groupByDay(data.transactions).map((group) => (
            <div key={group.day}>
              <h2 className="day">{dayLabel(group.day)}</h2>
              <ul>
                {group.items.map((t) => (
                  <li key={t.id}>
                    <i className="swatch" style={{ background: categoryColour(t.category_name) }} />
                    <div className="details">
                      <strong>{t.description}</strong>
                      <small>{t.category_name}</small>
                    </div>
                    <div className="row-buttons">
                      <button className="link" onClick={() => setEditing(t)}>Edit</button>
                      <button className="link danger" onClick={() => setDeleting(t)}>Delete</button>
                    </div>
                    <span className={`amount ${t.type}`}>{t.type === 'expense' ? '−' : '+'}{formatCurrency(t.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      {data && data.pagination.total_pages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {data.pagination.page} of {data.pagination.total_pages}</span>
          <button disabled={page >= data.pagination.total_pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      {editing && (
        <TransactionForm
          transaction={editing.id ? editing : null}
          categories={categories}
          onSave={saved}
          onCancel={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete transaction?"
          text={`“${deleting.description}”, ${formatCurrency(deleting.amount)}, will be deleted. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          busy={deleteBusy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  )
}
