// Error with an HTTP status. Thrown by the app's layers and turned into a JSON
// response by the error middleware (src/middlewares/errors.js).
class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.details = details
  }
}

const badRequest = (details, message = 'Invalid data.') => new HttpError(400, message, details)
const unauthorized = (message = 'Unauthorized.') => new HttpError(401, message)
const forbidden = (message = 'Action not allowed.') => new HttpError(403, message)
const notFound = (message = 'Resource not found.') => new HttpError(404, message)
const conflict = (message) => new HttpError(409, message)
const tooManyRequests = (message) => new HttpError(429, message)

module.exports = {
  HttpError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
}
