import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { categoryColour } from '../categories.js'
import { currentMonth, formatCurrency, formatDate, formatSigned, monthLabel, monthName, monthRange, shiftMonth } from '../format.js'
import { Donut, MonthChart, NetLine } from './Charts.jsx'

// Compares with the previous month; with no data last month there is nothing to compare.
function comparison(current, previous, previousMonth, { asPercent }) {
  if (previous.income + previous.expenses === 0) return ''
  const when = `in ${monthName(previousMonth)}`
  const difference = current - previous.value
  if (difference === 0) return `Same as ${when}`
  const moreOrLess = difference > 0 ? 'more' : 'less'
  if (!asPercent) return `${formatCurrency(Math.abs(difference))} ${moreOrLess} than ${when}`
  if (previous.value === 0) return ''
  return `${Math.round((Math.abs(difference) / previous.value) * 100)}% ${moreOrLess} than ${when}`
}

export default function Dashboard({ onNewTransaction, onSeeTransactions }) {
  const [month, setMonth] = useState(currentMonth())
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const year = Number(month.slice(0, 4))
  const previousMonth = shiftMonth(month, -1)

  useEffect(() => {
    let cancelled = false
    setError('')
    Promise.all([
      api.statement(monthRange(month)),
      api.statement(monthRange(previousMonth)),
      api.monthlySummary(year),
      api.transactions({ ...monthRange(month), limit: 5, order: 'desc' }),
    ])
      .then(([statement, previous, summary, recent]) => {
        if (!cancelled) setData({ statement, previous, summary, recent: recent.transactions })
      })
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [month, previousMonth, year])

  const picker = (
    <div className="month-picker">
      <button className="round" aria-label="Previous month" onClick={() => setMonth(previousMonth)}>‹</button>
      <h1 className="page-title">{monthLabel(month)}</h1>
      <button className="round" aria-label="Next month" onClick={() => setMonth(shiftMonth(month, 1))}>›</button>
    </div>
  )

  const header = (
    <div className="title-row">
      {picker}
      <button className="primary" onClick={onNewTransaction}>New transaction</button>
    </div>
  )

  if (error) return <>{header}<div className="alert error">{error}</div></>
  if (!data) return <>{header}<p className="empty">Loading…</p></>

  const { statement, previous, summary, recent } = data
  const empty = statement.income + statement.expenses === 0
  const spending = statement.by_category.filter((c) => c.type === 'expense').sort((a, b) => b.total - a.total)
  const highlight = Number(month.slice(5, 7)) - 1

  return (
    <>
      {header}

      <section className="stats">
        <div className="stat main">
          <span>Balance this month</span>
          <strong className={statement.balance < 0 ? 'negative' : ''}>
            {statement.balance < 0 ? formatSigned(statement.balance) : formatCurrency(statement.balance)}
          </strong>
          <small>{comparison(statement.balance, { ...previous, value: previous.balance }, previousMonth, { asPercent: false })}</small>
        </div>
        <div className="stat">
          <span>Income</span>
          <strong className="positive">+{formatCurrency(statement.income)}</strong>
          <small>{comparison(statement.income, { ...previous, value: previous.income }, previousMonth, { asPercent: true })}</small>
        </div>
        <div className="stat">
          <span>Expenses</span>
          <strong className="negative">−{formatCurrency(statement.expenses)}</strong>
          <small>{comparison(statement.expenses, { ...previous, value: previous.expenses }, previousMonth, { asPercent: true })}</small>
        </div>
      </section>

      {empty && (
        <section className="card invitation">
          <h2>Nothing recorded in {monthName(month)}</h2>
          <p>Add some income or an expense to see this month's balance and spending by category.</p>
          <button className="primary" onClick={onNewTransaction}>New transaction</button>
        </section>
      )}

      <div className="chart-grid">
        <section className="card wide">
          <div className="title-row">
            <h2>Month by month</h2>
            <div className="legend">
              <span><i className="dot income" /> Income</span>
              <span><i className="dot expense" /> Expenses</span>
            </div>
          </div>
          <MonthChart months={summary.months} year={year} highlight={highlight} />
        </section>

        <section className="card">
          <h2>Spending by category</h2>
          {spending.length === 0 ? (
            <p className="empty">No expenses this month.</p>
          ) : (
            <Donut spending={spending} total={statement.expenses} />
          )}
        </section>
      </div>

      <div className="chart-grid">
        <section className="card wide">
          <h2>What was left each month</h2>
          <p className="description">Income minus expenses in {year}</p>
          <NetLine months={summary.months} year={year} />
        </section>

        <section className="card">
          <div className="title-row">
            <h2>Latest transactions</h2>
            <button className="link" onClick={onSeeTransactions}>See all</button>
          </div>
          {recent.length === 0 ? (
            <p className="empty">No transactions in {monthName(month)}.</p>
          ) : (
            <ul className="mini-list">
              {recent.map((t) => (
                <li key={t.id}>
                  <i className="swatch" style={{ background: categoryColour(t.category_name) }} />
                  <div className="details">
                    <strong>{t.description}</strong>
                    <small>{t.category_name} · {formatDate(t.date)}</small>
                  </div>
                  <span className={`amount ${t.type}`}>{t.type === 'expense' ? '−' : '+'}{formatCurrency(t.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
