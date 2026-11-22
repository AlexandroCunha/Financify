import { OTHER_COLOUR, categoryColour } from '../categories.js'
import { formatCurrency, formatPercent, formatWholeCurrency, MONTH_NAMES } from '../format.js'

// Rounds the top of the axis up to a "round" number (1, 2, 2.5, 5 × 10^n), in cents.
export function niceScale(cents) {
  const euros = Math.max(cents / 100, 1)
  const magnitude = 10 ** Math.floor(Math.log10(euros))
  const step = [1, 2, 2.5, 5, 10].map((s) => s * magnitude).find((v) => v >= euros) ?? 10 * magnitude
  return Math.round(step * 100)
}

export function MonthChart({ months, year, highlight }) {
  const max = Math.max(0, ...months.flatMap((m) => [m.income, m.expenses]))
  const top = niceScale(max)
  const ofMonth =
    highlight == null
      ? ''
      : ` ${MONTH_NAMES[highlight]}: income of ${formatCurrency(months[highlight].income)} and expenses of ${formatCurrency(months[highlight].expenses)}.`

  return (
    <div
      className={`month-chart${highlight == null ? '' : ' has-highlight'}`}
      role="img"
      aria-label={`Income and expenses for each month of ${year}.${ofMonth}`}
    >
      <div className="axis" aria-hidden="true">
        {[1, 0.5, 0].map((f) => (
          <span key={f} style={{ bottom: `${f * 100}%` }}>{formatWholeCurrency(top * f)}</span>
        ))}
      </div>
      <div className="plot" aria-hidden="true">
        {[0.5, 1].map((f) => (
          <i key={f} className="gridline" style={{ bottom: `${f * 100}%` }} />
        ))}
        <div className="columns">
          {months.map((m, i) => (
            <div
              key={m.month}
              className={`column${i === highlight ? ' highlight' : ''}`}
              title={`${MONTH_NAMES[i]}: income ${formatCurrency(m.income)}, expenses ${formatCurrency(m.expenses)}`}
            >
              <div className="bar income" style={{ height: `${(m.income / top) * 100}%` }} />
              <div className="bar expense" style={{ height: `${(m.expenses / top) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="labels" aria-hidden="true">
        {MONTH_NAMES.map((name, i) => (
          <span key={name} className={i === highlight ? 'highlight' : ''}>{name}</span>
        ))}
      </div>
    </div>
  )
}

// The five biggest categories, with the rest grouped as "Other".
export function Donut({ spending, total }) {
  const biggest = spending.slice(0, 5).map((c) => ({ name: c.category_name, total: c.total, colour: categoryColour(c.category_name) }))
  const rest = spending.slice(5).reduce((sum, c) => sum + c.total, 0)
  const slices = rest > 0 ? [...biggest, { name: 'Other', total: rest, colour: OTHER_COLOUR }] : biggest

  let cumulative = 0
  const stops = slices.map((s) => {
    const start = cumulative
    cumulative += (s.total / total) * 100
    return `${s.colour} ${start}% ${cumulative}%`
  })
  const description = slices.map((s) => `${s.name} ${formatPercent(s.total / total)}`).join(', ')

  return (
    <div className="donut-block">
      <div className="donut" style={{ background: `conic-gradient(${stops.join(', ')})` }} role="img" aria-label={`Expenses by category: ${description}.`}>
        <div className="donut-center">
          <span>Expenses</span>
          <strong>{formatWholeCurrency(total)}</strong>
        </div>
      </div>
      <ul className="legend-list">
        {slices.map((s) => (
          <li key={s.name} title={formatCurrency(s.total)}>
            <i className="swatch" style={{ background: s.colour }} />
            <span>{s.name}</span>
            <small>{formatPercent(s.total / total)}</small>
          </li>
        ))}
      </ul>
    </div>
  )
}

const WIDTH = 480
const LEFT = 44
const CELL = (WIDTH - LEFT) / 12
const TOP = 24
const HEIGHT = 120

// Each month's result (income minus expenses) as a line, from the first to the last month with data.
export function NetLine({ months, year }) {
  const hasData = (m) => m.income || m.expenses
  const first = months.findIndex(hasData)
  const last = months.reduce((l, m, i) => (hasData(m) ? i : l), -1)
  if (first < 0 || last - first < 1) {
    return <p className="empty">Once you have transactions in two or more months, the line shows up here.</p>
  }

  const results = months.slice(first, last + 1).map((m) => m.income - m.expenses)
  const high = Math.max(0, ...results) > 0 ? niceScale(Math.max(...results)) : 0
  const low = Math.min(0, ...results) < 0 ? -niceScale(-Math.min(...results)) : 0
  const range = high - low || 1
  const y = (v) => TOP + ((high - v) / range) * HEIGHT
  const x = (i) => LEFT + CELL * (first + i) + CELL / 2

  const points = results.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
  const area = `${points.join(' ')} ${x(results.length - 1).toFixed(1)},${y(0).toFixed(1)} ${x(0).toFixed(1)},${y(0).toFixed(1)}`
  const references = [...new Set([high, 0, low])]

  const iMax = results.indexOf(Math.max(...results))
  const iMin = results.indexOf(Math.min(...results))
  const description = `Result for each month of ${year}. Highest: ${MONTH_NAMES[first + iMax]}, ${formatCurrency(results[iMax])}. Lowest: ${MONTH_NAMES[first + iMin]}, ${formatCurrency(results[iMin])}.`

  return (
    <>
      <svg viewBox={`0 0 ${WIDTH} ${TOP + HEIGHT + 8}`} className="line-svg" role="img" aria-label={description}>
        <defs>
          <marker id="result-dot" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" refX="6" refY="6">
            <circle cx="6" cy="6" r="4" fill="var(--card)" stroke="var(--income)" strokeWidth="2" />
          </marker>
        </defs>
        {references.map((v) => (
          <g key={v}>
            <line x1={LEFT} x2={WIDTH} y1={y(v)} y2={y(v)} stroke={v === 0 ? 'var(--field-border)' : 'var(--border)'} />
            <text x="0" y={y(v) + 4} fontSize="11" fill="var(--muted)">{formatWholeCurrency(v)}</text>
          </g>
        ))}
        <polygon points={area} fill="var(--income)" fillOpacity="0.1" />
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke="var(--income)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          markerStart="url(#result-dot)"
          markerMid="url(#result-dot)"
          markerEnd="url(#result-dot)"
        />
      </svg>
      <div className="labels line-labels" aria-hidden="true">
        {MONTH_NAMES.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>
    </>
  )
}
