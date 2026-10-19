const config = require('../config/env')

// Cabeçalhos de segurança básicos para uma API JSON.
function cabecalhosDeSeguranca(req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Cross-Origin-Opener-Policy': 'same-origin',
  })
  if (config.ambiente === 'production') {
    res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains')
  }
  next()
}

// CORS: libera só as origens do CORS_ORIGIN (ou todas, com "*").
function cors(origensPermitidas) {
  const liberaTodas = origensPermitidas.includes('*')
  return (req, res, next) => {
    const origem = req.get('origin')
    if (!origem || !(liberaTodas || origensPermitidas.includes(origem))) return next()

    res.set('Access-Control-Allow-Origin', liberaTodas ? '*' : origem)
    res.set('Access-Control-Expose-Headers', 'RateLimit-Limit, RateLimit-Remaining, Retry-After')
    if (!liberaTodas) res.vary('Origin')

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

module.exports = { cabecalhosDeSeguranca, cors }
