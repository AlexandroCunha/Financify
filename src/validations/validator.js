// Input validator with no external dependencies.
// Each rule takes a value and returns { value } (cleaned/converted) or { error }.
const { badRequest } = require('../utils/errors')

const ok = (value) => ({ value })
const fail = (error) => ({ error })

function text({ min = 1, max = 255, trim = true, lowercase = false } = {}) {
  return (value) => {
    if (typeof value !== 'string') return fail('must be text')
    let clean = trim ? value.trim() : value
    if (lowercase) clean = clean.toLowerCase()
    if (clean.length === 0) return fail('cannot be empty')
    if (clean.length < min) return fail(`must be at least ${min} characters long`)
    if (clean.length > max) return fail(`must be at most ${max} characters long`)
    return ok(clean)
  }
}

function email() {
  const textRule = text({ max: 254, lowercase: true })
  return (value) => {
    const result = textRule(value)
    if (result.error) return result
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.value) ? result : fail('must be a valid e-mail')
  }
}

// Password: spaces are kept. bcrypt only looks at the first 72 bytes.
const password = ({ min = 8 } = {}) => text({ min, max: 72, trim: false })

function integer({ min = 1, max = 2_147_483_647, acceptText = false } = {}) {
  return (value) => {
    let number = value
    if (acceptText && typeof value === 'string' && /^\s*-?\d+\s*$/.test(value)) number = Number(value)
    if (typeof number !== 'number' || !Number.isInteger(number)) return fail('must be a whole number')
    if (number < min) return fail(`must be ${min} or more`)
    if (number > max) return fail(`must be ${max} or less`)
    return ok(number)
  }
}

function amountInCents() {
  const rule = integer({ min: 1 })
  return (value) =>
    rule(value).error ? fail('must be a whole number greater than zero, in cents (e.g. 1050 = €10.50)') : ok(value)
}

function date() {
  return (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fail('must use the YYYY-MM-DD format')
    const [year, month, day] = value.split('-').map(Number)
    const calendar = new Date(Date.UTC(year, month - 1, day))
    const exists =
      calendar.getUTCFullYear() === year && calendar.getUTCMonth() === month - 1 && calendar.getUTCDate() === day
    if (!exists || year < 1900 || year > 2999) return fail('is not a valid date')
    return ok(value)
  }
}

function oneOf(allowed) {
  return (value) => (allowed.includes(value) ? ok(value) : fail(`must be one of: ${allowed.join(', ')}`))
}

// For the query string: accepts "1,2", ?x=1&x=2 or a single value, and checks each item.
function list(itemRule) {
  return (value) => {
    const items = [value]
      .flat()
      .flatMap((item) => String(item).split(','))
      .map((item) => item.trim())
      .filter(Boolean)
    const values = []
    for (const item of items) {
      const result = itemRule(item)
      if (result.error) return fail(`has an invalid value ("${item}"): ${result.error}`)
      values.push(result.value)
    }
    return ok(values)
  }
}

const optional = (rule) => ({ optional: true, rule })

// Combines the rules of each field. Fields that are not in the schema are ignored.
// - partial: no field is required (handy for PATCH)
// - ignoreEmpty: treats "" as missing (handy for query strings)
function schema(fields, { partial = false, ignoreEmpty = false } = {}) {
  return (input) => {
    const source = input !== null && typeof input === 'object' && !Array.isArray(input) ? input : {}
    const data = {}
    const errors = {}
    for (const [field, definition] of Object.entries(fields)) {
      const { optional: isOptional = false, rule } = typeof definition === 'function' ? { rule: definition } : definition
      const value = source[field]
      const missing = value === undefined || value === null || (ignoreEmpty && value === '')
      if (missing) {
        if (!isOptional && !partial) errors[field] = 'is required'
        continue
      }
      const result = rule(value)
      if (result.error) errors[field] = result.error
      else data[field] = result.value
    }
    return { data, errors }
  }
}

// Validates and returns the clean data, or throws 400 with the error of each field.
function validate(validationSchema, input) {
  const { data, errors } = validationSchema(input)
  if (Object.keys(errors).length > 0) throw badRequest(errors)
  return data
}

module.exports = {
  text,
  email,
  password,
  integer,
  amountInCents,
  date,
  oneOf,
  list,
  optional,
  schema,
  validate,
}
