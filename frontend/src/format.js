const LOCALE = 'en-IE'
const currency = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'EUR' })
const wholeCurrency = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const percent = new Intl.NumberFormat(LOCALE, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })

export const formatCurrency = (cents) => currency.format(cents / 100)
export const formatWholeCurrency = (cents) => wholeCurrency.format(cents / 100)
export const formatPercent = (fraction) => percent.format(fraction)

// "+€10.00" / "−€10.00": the same format on the dashboard and in the transaction list.
export const formatSigned = (cents) => `${cents < 0 ? '−' : '+'}${formatCurrency(Math.abs(cents))}`

// "2026-10-19" -> "19 Oct 2026" (read as UTC, so the day does not shift with the time zone)
export const formatDate = (iso) =>
  new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// "10.50" / "1,050.25" (euros) -> 1050 / 105025 cents; NaN if invalid
export function amountToCents(text) {
  const clean = String(text).trim().replace(/,/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return NaN
  return Math.round(parseFloat(clean) * 100)
}

export const centsToText = (cents) => (cents / 100).toFixed(2)

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LONG_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// Months are "YYYY-MM".
export const currentMonth = () => today().slice(0, 7)

export function shiftMonth(month, delta) {
  const [year, number] = month.split('-').map(Number)
  const index = year * 12 + (number - 1) + delta
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}

export function monthRange(month) {
  const [year, number] = month.split('-').map(Number)
  const last = new Date(year, number, 0).getDate()
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` }
}

export const monthName = (month) => LONG_MONTHS[Number(month.slice(5, 7)) - 1]
export const monthLabel = (month) => `${monthName(month)} ${month.slice(0, 4)}`

// "2026-11-22" -> "Sunday 22 November" (UTC, so the day does not shift with the time zone)
export const dayLabel = (iso) =>
  new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
