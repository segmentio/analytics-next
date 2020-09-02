import express from 'express'
import helmet from 'helmet'
import * as Sentry from '@sentry/node'
import { nanoid } from 'nanoid'
import stats from './lib/stats'
import logger from './lib/logger'
import routes from './routes'
import { NODE_ENV } from './config'

const app = express()

// Causes `req.ip` to be set to the `X-Forwarded-For` header value, which is set by the ELB
app.set('trust proxy', true)

// Sets a bunch of security headers
app.use(helmet())

// Request metrics/logging
// Positioned first so that requests with JSON errors still get logged
app.use(stats.middleware())
app.use((req, res, next): void => {
  const start = Date.now()
  // Generate an ID for the request. Used for tying together request logs and errors
  req.requestId = nanoid()

  logger.info('🌎  Request', {
    requestId: req.requestId,
    referer: req.headers.referer,
    userAgent: req.headers['user-agent'],
    method: req.method,
    path: req.path,
  })

  res.once('finish', (): void => {
    logger.info('✅  Response', {
      requestId: req.requestId,
      referer: req.headers.referer,
      userAgent: req.headers['user-agent'],
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: Date.now() - start,
    })
  })

  next()
})

app.use(express.json())

// Endpoint used by ECS to check that the server is still alive
app.get('/healthcheck', (_req, res): void => {
  res.send('🏥')
})

// Enforce that requesting services identify themselves for debugging purposes
const userAgentRegex = /^Segment \(.*?\)$/
app.use((req, res, next): void => {
  if (NODE_ENV === 'development') {
    return next()
  }

  const userAgent = req.headers['user-agent']
  if (typeof userAgent !== 'string' || !userAgentRegex.test(userAgent)) {
    res.status(400).send('User-Agent header in the format of `Segment (service name)` is required')
  } else {
    next()
  }
})

app.use(routes)

// Catch all error handler
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((error: any, req: express.Request, res: express.Response, _next: express.NextFunction): void => {
  // Decorate the error with useful info to aid debugging
  error.requestId = req.requestId
  error.referer = req.headers.referer
  error.userAgent = req.headers['user-agent']
  error.method = req.method
  error.path = req.path
  error.route = req.route?.path || 'unknown'

  const errorStatusCode = error.statusCode || error.status
  let statusCode = 500
  let message = 'Internal server error'

  // Return user errors and don't log them
  // E.g: validation errors, JSON parsing errors, payload too large errors
  if (error.expose && errorStatusCode >= 400 && errorStatusCode <= 499) {
    statusCode = errorStatusCode
    message = error.message
  } else {
    logger.error('🤦  Server Error', error)
    Sentry.captureException(error)
    stats.increment('errors', 1, [`path:${req.path}`])
  }

  // Only return the error message in development
  if (NODE_ENV === 'development' || NODE_ENV === 'test') {
    message = error.message || error
  }

  res.status(statusCode).json({ error: message })
})

export default app
