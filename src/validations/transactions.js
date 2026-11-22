const { schema, text, integer, amountInCents, date, oneOf, list, optional } = require('./validator')

const TYPES = ['income', 'expense']

const transaction = schema({
  description: text({ max: 255 }),
  amount: amountInCents(),
  date: date(),
  category_id: integer(),
  type: oneOf(TYPES),
})

const idParam = schema({
  id: integer({ acceptText: true }),
})

const listFilters = schema(
  {
    type: optional(oneOf(TYPES)),
    category_id: optional(list(integer({ acceptText: true }))),
    from: optional(date()),
    to: optional(date()),
    page: optional(integer({ acceptText: true })),
    limit: optional(integer({ max: 100, acceptText: true })),
    order: optional(oneOf(['asc', 'desc'])),
  },
  { ignoreEmpty: true },
)

const period = schema(
  {
    from: optional(date()),
    to: optional(date()),
  },
  { ignoreEmpty: true },
)

const monthlySummary = schema(
  {
    year: optional(integer({ min: 1900, max: 2999, acceptText: true })),
  },
  { ignoreEmpty: true },
)

module.exports = { transaction, idParam, listFilters, period, monthlySummary }
