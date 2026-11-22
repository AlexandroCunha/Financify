// OpenAPI 3.1 spec of the API: served at /docs/openapi.json and shown in Swagger UI at /docs.
const { version } = require('../../package.json')

const ref = (name) => ({ $ref: `#/components/schemas/${name}` })
const response = (description, schema) =>
  schema ? { description, content: { 'application/json': { schema } } } : { description }
const error = (description) => response(description, ref('Error'))
const body = (schema, example) => ({ required: true, content: { 'application/json': { schema, example } } })

const signedIn = [{ bearerAuth: [] }]
const notSignedIn = error('Missing, invalid or expired token')
const invalidData = error('Invalid data (see the "errors" field)')

const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }
const periodParams = [
  { name: 'from', in: 'query', description: 'Start date (YYYY-MM-DD)', schema: { type: 'string', format: 'date' } },
  { name: 'to', in: 'query', description: 'End date (YYYY-MM-DD)', schema: { type: 'string', format: 'date' } },
]
const TYPES = ['income', 'expense']

const transactionExample = {
  description: 'October salary',
  amount: 500000,
  date: '2026-10-05',
  category_id: 14,
  type: 'income',
}

module.exports = {
  openapi: '3.1.0',
  info: {
    title: 'Financify API',
    version,
    description:
      'REST API for personal finances.\n\n' +
      '- Amounts are **whole numbers in cents** (1050 = €10.50).\n' +
      '- Dates use the **YYYY-MM-DD** format.\n\n' +
      'To try it here: sign up, sign in, copy the `token` and click **Authorize**. ' +
      'Or call `POST /demo` to get a demo account with sample data.',
  },
  servers: [{ url: '/' }],
  tags: [{ name: 'Auth' }, { name: 'Users' }, { name: 'Categories' }, { name: 'Transactions' }, { name: 'System' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', example: 'Invalid data.' },
          errors: {
            type: 'object',
            additionalProperties: { type: 'string' },
            example: { email: 'must be a valid e-mail' },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Ana Souza' },
          email: { type: 'string', format: 'email', example: 'ana@email.com' },
          demo: { type: 'boolean', description: 'true in a demo account', example: false },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      NewUser: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', maxLength: 100 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 72 },
        },
      },
      UserUpdate: {
        type: 'object',
        minProperties: 1,
        properties: {
          name: { type: 'string', maxLength: 100 },
          email: { type: 'string', format: 'email' },
        },
      },
      PasswordChange: {
        type: 'object',
        required: ['current_password', 'new_password'],
        properties: {
          current_password: { type: 'string' },
          new_password: { type: 'string', minLength: 8, maxLength: 72 },
        },
      },
      Credentials: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          user: ref('User'),
          token: { type: 'string', description: 'Send it in the header Authorization: Bearer <token>' },
        },
      },
      DemoResponse: {
        type: 'object',
        properties: {
          user: ref('User'),
          token: { type: 'string', description: 'Send it in the header Authorization: Bearer <token>. Valid for 2 hours.' },
          expires_in_hours: { type: 'integer', example: 24, description: 'After that the account and its data are deleted' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 14 },
          name: { type: 'string', example: 'Salary' },
        },
      },
      NewTransaction: {
        type: 'object',
        required: ['description', 'amount', 'date', 'category_id', 'type'],
        properties: {
          description: { type: 'string', maxLength: 255 },
          amount: { type: 'integer', minimum: 1, description: 'In cents' },
          date: { type: 'string', format: 'date' },
          category_id: { type: 'integer', minimum: 1 },
          type: { type: 'string', enum: TYPES },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          type: { type: 'string', enum: TYPES },
          description: { type: 'string', example: 'October salary' },
          amount: { type: 'integer', example: 500000, description: 'In cents' },
          date: { type: 'string', format: 'date', example: '2026-10-05' },
          category_id: { type: 'integer', example: 14 },
          category_name: { type: 'string', example: 'Salary' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      TransactionList: {
        type: 'object',
        properties: {
          transactions: { type: 'array', items: ref('Transaction') },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 20 },
              total: { type: 'integer', example: 42 },
              total_pages: { type: 'integer', example: 3 },
            },
          },
        },
      },
      Statement: {
        type: 'object',
        properties: {
          period: {
            type: 'object',
            properties: {
              from: { type: ['string', 'null'], format: 'date' },
              to: { type: ['string', 'null'], format: 'date' },
            },
          },
          income: { type: 'integer', example: 500000 },
          expenses: { type: 'integer', example: 12050 },
          balance: { type: 'integer', example: 487950 },
          by_category: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category_id: { type: 'integer' },
                category_name: { type: 'string' },
                type: { type: 'string', enum: TYPES },
                total: { type: 'integer' },
                count: { type: 'integer' },
              },
            },
          },
        },
      },
      MonthlySummary: {
        type: 'object',
        properties: {
          year: { type: 'integer', example: 2026 },
          months: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                month: { type: 'string', example: '2026-10' },
                income: { type: 'integer' },
                expenses: { type: 'integer' },
                balance: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/users': {
      post: {
        tags: ['Users'],
        summary: 'Sign up',
        requestBody: body(ref('NewUser'), { name: 'Ana Souza', email: 'ana@email.com', password: 'strong-password-123' }),
        responses: {
          201: response('User created', ref('User')),
          400: invalidData,
          409: error('An account with this e-mail already exists'),
        },
      },
    },
    '/login': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in and get a token',
        requestBody: body(ref('Credentials'), { email: 'ana@email.com', password: 'strong-password-123' }),
        responses: {
          200: response('Signed in', ref('LoginResponse')),
          400: invalidData,
          401: error('Invalid e-mail or password'),
          429: error('Too many attempts; try again later'),
        },
      },
    },
    '/demo': {
      post: {
        tags: ['Auth'],
        summary: 'Create a demo account, already signed in',
        description:
          'Creates an account just for the caller, with sample transactions from the last few months, and returns the token. ' +
          'The account is deleted after 24 hours. Its e-mail and password cannot be changed.',
        responses: {
          201: response('Demo account created', ref('DemoResponse')),
          429: error('Too many demo accounts created from this IP; try again later'),
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get the signed-in user',
        security: signedIn,
        responses: { 200: response('Signed-in user', ref('User')), 401: notSignedIn },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update name and/or e-mail',
        security: signedIn,
        requestBody: body(ref('UserUpdate'), { name: 'Ana Maria Souza' }),
        responses: {
          200: response('User updated', ref('User')),
          400: invalidData,
          401: notSignedIn,
          403: error('Not available in a demo account (e-mail)'),
          409: error('An account with this e-mail already exists'),
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete your own account (and all its transactions)',
        security: signedIn,
        responses: { 204: response('Account deleted'), 401: notSignedIn },
      },
    },
    '/users/me/password': {
      put: {
        tags: ['Users'],
        summary: 'Change the password',
        security: signedIn,
        requestBody: body(ref('PasswordChange'), { current_password: 'strong-password-123', new_password: 'new-password-456' }),
        responses: {
          204: response('Password changed'),
          400: invalidData,
          401: notSignedIn,
          403: error('Not available in a demo account'),
        },
      },
    },
    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List categories',
        security: signedIn,
        responses: {
          200: response('Categories', { type: 'array', items: ref('Category') }),
          401: notSignedIn,
        },
      },
    },
    '/transactions': {
      get: {
        tags: ['Transactions'],
        summary: 'List transactions (with filters and pagination)',
        security: signedIn,
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: TYPES } },
          {
            name: 'category_id',
            in: 'query',
            description: 'One or more categories: ?category_id=1,4 or ?category_id=1&category_id=4',
            schema: { type: 'string', example: '1,4' },
          },
          ...periodParams,
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
          { name: 'order', in: 'query', description: 'By date', schema: { type: 'string', enum: ['desc', 'asc'], default: 'desc' } },
        ],
        responses: { 200: response('A page of transactions', ref('TransactionList')), 400: invalidData, 401: notSignedIn },
      },
      post: {
        tags: ['Transactions'],
        summary: 'Create a transaction',
        security: signedIn,
        requestBody: body(ref('NewTransaction'), transactionExample),
        responses: { 201: response('Transaction created', ref('Transaction')), 400: invalidData, 401: notSignedIn },
      },
    },
    '/transactions/statement': {
      get: {
        tags: ['Transactions'],
        summary: 'Statement: income, expenses, balance and totals by category',
        security: signedIn,
        parameters: periodParams,
        responses: { 200: response('Statement', ref('Statement')), 400: invalidData, 401: notSignedIn },
      },
    },
    '/transactions/monthly-summary': {
      get: {
        tags: ['Transactions'],
        summary: 'Month-by-month totals for a year (for charts)',
        security: signedIn,
        parameters: [{ name: 'year', in: 'query', description: 'Default: the current year', schema: { type: 'integer' } }],
        responses: { 200: response('Summary of the year', ref('MonthlySummary')), 400: invalidData, 401: notSignedIn },
      },
    },
    '/transactions/{id}': {
      parameters: [idParam],
      get: {
        tags: ['Transactions'],
        summary: 'Get a transaction',
        security: signedIn,
        responses: { 200: response('Transaction', ref('Transaction')), 401: notSignedIn, 404: error('Transaction not found') },
      },
      put: {
        tags: ['Transactions'],
        summary: 'Update a transaction',
        security: signedIn,
        requestBody: body(ref('NewTransaction'), transactionExample),
        responses: {
          200: response('Transaction updated', ref('Transaction')),
          400: invalidData,
          401: notSignedIn,
          404: error('Transaction not found'),
        },
      },
      delete: {
        tags: ['Transactions'],
        summary: 'Delete a transaction',
        security: signedIn,
        responses: { 204: response('Transaction deleted'), 401: notSignedIn, 404: error('Transaction not found') },
      },
    },
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Check that the API and the database are up',
        responses: {
          200: response('All good', { type: 'object', properties: { status: { type: 'string', example: 'ok' } } }),
          503: response('Database unavailable'),
        },
      },
    },
  },
}
