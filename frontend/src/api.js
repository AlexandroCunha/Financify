const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const TOKEN_KEY = 'financify.token'

export const token = {
  read: () => localStorage.getItem(TOKEN_KEY),
  save: (value) => localStorage.setItem(TOKEN_KEY, value),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  constructor(status, message, errors) {
    super(message)
    this.status = status
    this.errors = errors ?? {}
  }
}

let onExpired = () => {}
export const setOnExpired = (fn) => (onExpired = fn)

async function request(method, route, { body, query } = {}) {
  const url = new URL(BASE + route)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== '' && value != null) url.searchParams.set(key, value)
  }
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  const jwt = token.read()
  if (jwt) headers.Authorization = `Bearer ${jwt}`

  let response
  try {
    response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw new ApiError(0, 'Could not reach the API. Check that it is running.')
  }

  if (response.status === 204) return null
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    // 401 with an active session = expired token; on the sign-in screen it is just wrong credentials.
    if (response.status === 401 && jwt) onExpired()
    throw new ApiError(response.status, data.message ?? 'Unexpected error.', data.errors)
  }
  return data
}

export const api = {
  login: (body) => request('POST', '/login', { body }),
  demo: () => request('POST', '/demo'),
  signUp: (body) => request('POST', '/users', { body }),
  profile: () => request('GET', '/users/me'),
  updateProfile: (body) => request('PATCH', '/users/me', { body }),
  changePassword: (body) => request('PUT', '/users/me/password', { body }),
  deleteAccount: () => request('DELETE', '/users/me'),
  categories: () => request('GET', '/categories'),
  transactions: (query) => request('GET', '/transactions', { query }),
  statement: (query) => request('GET', '/transactions/statement', { query }),
  monthlySummary: (year) => request('GET', '/transactions/monthly-summary', { query: { year } }),
  createTransaction: (body) => request('POST', '/transactions', { body }),
  updateTransaction: (id, body) => request('PUT', `/transactions/${id}`, { body }),
  deleteTransaction: (id) => request('DELETE', `/transactions/${id}`),
}
