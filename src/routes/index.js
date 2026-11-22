const { Router } = require('express')
const authenticate = require('../middlewares/authenticate')
const rateLimit = require('../middlewares/rateLimit')
const auth = require('../controllers/auth')
const demo = require('../controllers/demo')
const users = require('../controllers/users')
const categories = require('../controllers/categories')
const transactions = require('../controllers/transactions')

function createRoutes({ maxLoginAttempts, maxDemoAccounts }) {
  const routes = Router()

  // Public
  const loginLimit =
    maxLoginAttempts > 0
      ? [rateLimit({ max: maxLoginAttempts, message: 'Too many login attempts. Try again in a few minutes.' })]
      : []
  routes.post('/login', ...loginLimit, auth.login)
  routes.post('/users', users.signUp)

  // Demo account with sample data (one per visitor, deleted after 24 hours)
  const demoLimit =
    maxDemoAccounts > 0
      ? [rateLimit({ max: maxDemoAccounts, message: 'Too many demo accounts created. Try again in a few minutes.' })]
      : []
  routes.post('/demo', ...demoLimit, demo.create)

  // The signed-in user's account
  routes.get('/users/me', authenticate, users.show)
  routes.patch('/users/me', authenticate, users.update)
  routes.put('/users/me/password', authenticate, users.changePassword)
  routes.delete('/users/me', authenticate, users.remove)

  // Categories and transactions (all need a signed-in user)
  routes.get('/categories', authenticate, categories.list)

  const transactionRoutes = Router()
  transactionRoutes.use(authenticate)
  transactionRoutes.get('/', transactions.list)
  transactionRoutes.get('/statement', transactions.statement)
  transactionRoutes.get('/monthly-summary', transactions.monthlySummary)
  transactionRoutes.get('/:id', transactions.show)
  transactionRoutes.post('/', transactions.create)
  transactionRoutes.put('/:id', transactions.update)
  transactionRoutes.delete('/:id', transactions.remove)
  routes.use('/transactions', transactionRoutes)

  return routes
}

module.exports = createRoutes
