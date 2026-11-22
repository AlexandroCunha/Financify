const config = require('../config/env')

// Basic security headers for a JSON API.
function securityHeaders(req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Cross-Origin-Opener-Policy': 'same-origin',
  })
  if (config.environment === 'production') {
    res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains')
  }
  next()
}

// CORS: allows only the CORS_ORIGIN origins (or all of them, with "*").
function cors(allowedOrigins) {
  const allowAll = allowedOrigins.includes('*')
  return (req, res, next) => {
    const origin = req.get('origin')
    if (!origin || !(allowAll || allowedOrigins.includes(origin))) return next()

    res.set('Access-Control-Allow-Origin', allowAll ? '*' : origin)
    res.set('Access-Control-Expose-Headers', 'RateLimit-Limit, RateLimit-Remaining, Retry-After')
    if (!allowAll) res.vary('Origin')

    if (req.method === 'OPTIONS') {
      res.set({
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '600',
      })
      return res.status(204).end()
    }
    next()
  }
}

module.exports = { securityHeaders, cors }
