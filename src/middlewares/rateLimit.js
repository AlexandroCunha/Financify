const { tooManyRequests } = require('../utils/errors')

// Per-IP request limit over a time window, kept in memory.
// Enough for a single instance; with several instances, use a shared store (e.g. Redis).
function rateLimit({ max, windowMs = 15 * 60 * 1000, message = 'Too many requests. Try again later.' }) {
  const counts = new Map()

  const cleanup = setInterval(() => {
    const now = Date.now()
    for (const [ip, entry] of counts) {
      if (entry.expiresAt <= now) counts.delete(ip)
    }
  }, windowMs)
  cleanup.unref()

  return (req, res, next) => {
    const now = Date.now()
    let entry = counts.get(req.ip)
    if (!entry || entry.expiresAt <= now) {
      entry = { total: 0, expiresAt: now + windowMs }
      counts.set(req.ip, entry)
    }
    entry.total += 1

    res.set('RateLimit-Limit', String(max))
    res.set('RateLimit-Remaining', String(Math.max(0, max - entry.total)))
    if (entry.total > max) {
      res.set('Retry-After', String(Math.ceil((entry.expiresAt - now) / 1000)))
      throw tooManyRequests(message)
    }
    next()
  }
}

module.exports = rateLimit
