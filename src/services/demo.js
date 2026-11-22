const crypto = require('node:crypto')
const bcrypt = require('bcrypt')
const demo = require('../repositories/demo')
const { createToken } = require('./auth')

// A demo account lives for 24 hours; its sign-in lasts 2 (after that, just ask for a new one).
const LIFETIME_HOURS = 24
const SIGN_IN_DURATION = '2h'
const MONTHS_WITH_DATA = 4 // the previous 3 months and the current one

// A typical month. day: day of the month; amount: in euro cents.
const TYPICAL_MONTH = [
  { day: 1, description: 'Salary', amount: 325000, type: 'income', category: 'Salary' },
  { day: 1, description: 'Rent', amount: 95000, type: 'expense', category: 'Home' },
  { day: 3, description: 'Monthly travel pass', amount: 9000, type: 'expense', category: 'Transport' },
  { day: 4, description: 'Supermarket', amount: 8740, type: 'expense', category: 'Groceries' },
  { day: 6, description: 'Music streaming', amount: 1199, type: 'expense', category: 'Subscriptions and Services' },
  { day: 8, description: 'Lunch with colleagues', amount: 2450, type: 'expense', category: 'Food' },
  { day: 11, description: 'Supermarket', amount: 6320, type: 'expense', category: 'Groceries' },
  { day: 12, description: 'Broadband', amount: 3999, type: 'expense', category: 'Subscriptions and Services' },
  { day: 14, description: 'Pharmacy', amount: 1850, type: 'expense', category: 'Health' },
  { day: 16, description: 'Cinema', amount: 2400, type: 'expense', category: 'Leisure' },
  { day: 18, description: 'Supermarket', amount: 7110, type: 'expense', category: 'Groceries' },
  { day: 20, description: 'Freelance project', amount: 45000, type: 'income', category: 'Sales', everyOtherMonth: true },
  { day: 22, description: 'Dinner out', amount: 5600, type: 'expense', category: 'Food' },
  { day: 25, description: 'Supermarket', amount: 5480, type: 'expense', category: 'Groceries' },
  { day: 27, description: 'Online course', amount: 2900, type: 'expense', category: 'Education', everyOtherMonth: true },
]

const twoDigits = (n) => String(n).padStart(2, '0')

// Sample transactions for the last few months, up to today (nothing in the future).
// Amounts change a little from month to month, so the chart is not flat.
function sampleTransactions(today = new Date()) {
  const transactions = []
  for (let monthsAgo = MONTHS_WITH_DATA - 1; monthsAgo >= 0; monthsAgo -= 1) {
    const reference = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - monthsAgo, 1))
    const year = reference.getUTCFullYear()
    const month = reference.getUTCMonth()
    const variation = 1 + ((month % 3) - 1) * 0.06
    for (const item of TYPICAL_MONTH) {
      if (item.everyOtherMonth && month % 2 === 1) continue
      if (monthsAgo === 0 && item.day > today.getUTCDate()) continue
      const fixed = item.type === 'income' || item.category === 'Home' || item.category === 'Subscriptions and Services'
      transactions.push({
        description: item.description,
        amount: fixed ? item.amount : Math.round(item.amount * variation),
        date: `${year}-${twoDigits(month + 1)}-${twoDigits(item.day)}`,
        type: item.type,
        category: item.category,
      })
    }
  }
  return transactions
}

async function createDemoAccount() {
  const id = crypto.randomBytes(8).toString('hex')
  // A random password nobody knows: the account is only reached through the token returned here.
  const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10)
  const user = await demo.createWithTransactions({
    name: 'Demo account',
    email: `demo-${id}@financify.invalid`,
    passwordHash,
    transactions: sampleTransactions(),
    lifetimeHours: LIFETIME_HOURS,
  })
  return {
    user,
    token: createToken(user.id, { expiresIn: SIGN_IN_DURATION }),
    expires_in_hours: LIFETIME_HOURS,
  }
}

module.exports = { createDemoAccount, sampleTransactions, LIFETIME_HOURS }
