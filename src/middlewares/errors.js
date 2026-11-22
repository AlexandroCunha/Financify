const { HttpError } = require('../utils/errors')

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` })
}

// Last middleware: turns any error into a standard JSON response { message, errors? }.
function handleErrors(error, req, res, next) {
  if (res.headersSent) return next(error)

  if (error instanceof HttpError) {
    const body = { message: error.message }
    if (error.details) body.errors = error.details
    return res.status(error.status).json(body)
  }

  // express.json() errors: malformed JSON, body too large, unsupported charset...
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'The request body is not valid JSON.' })
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ message: 'The request body is too large.' })
  }
  if (Number.isInteger(error.status) && error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ message: error.expose ? error.message : 'Bad request.' })
  }

  // Unexpected error: log everything, but keep internal details out of the response.
  console.error(`[error] ${req.method} ${req.originalUrl}`, error)
  res.status(500).json({ message: 'Internal server error.' })
}

module.exports = { notFound, handleErrors }
