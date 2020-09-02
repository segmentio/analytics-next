import 'source-map-support/register'
import http from 'http'
import { once } from 'lodash'
import * as Sentry from '@sentry/node'
import * as SentryIntegrations from '@sentry/integrations'
import blockedStats from '@segment/blocked-stats'
import app from './app'
import logger from './lib/logger'
import stats from './lib/stats'
import { PORT, NODE_ENV, SENTRY_DSN } from './config'

Sentry.init({
  dsn: SENTRY_DSN,
  environment: NODE_ENV,
  // Disable the default OnUncaughtException and OnUnhandledRejection integrations
  defaultIntegrations: false,
  // https://docs.sentry.io/platforms/node/default-integrations/#core
  integrations: [
    new Sentry.Integrations.FunctionToString(),
    new Sentry.Integrations.Console(),
    new Sentry.Integrations.Http(),
    new SentryIntegrations.ExtraErrorData(),
  ],
})

// Track blocked event loop metrics
blockedStats(logger, stats)

const server = http.createServer(app).listen(PORT, (): void => {
  logger.info(`Listening at http://localhost:${PORT}`)
})

const gracefulShutdown = once((exitCode): void => {
  logger.info('Server stopping...')

  // Stop receiving new requests, allowing inflight requests to finish
  server.close((): void => {
    logger.info('Server stopped')
    // Leave time for logging / error capture
    setTimeout((): void => process.exit(exitCode), 300)
  })

  // Forcibly shutdown after 8 seconds (Docker forcibly kills after 10 seconds)
  setTimeout((): void => {
    logger.crit('Forcibly shutting down')
    // Leave time for logging / error capture
    setTimeout((): void => process.exit(1), 300)
  }, 8000)
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleUncaught(error: any, crashType: string): void {
  error.crashType = crashType
  Sentry.withScope((scope): void => {
    scope.setTag('crashType', crashType)
    Sentry.captureException(error)
  })
  stats.increment('crash', 1, [`type:${crashType}`])
  logger.crit('😱  Server crashed', error)

  // Gracefully shutdown the server on uncaught errors to allow inflight requests to finish
  gracefulShutdown(1)
}

process.on('uncaughtException', (error): void => {
  handleUncaught(error, 'uncaughtException')
})
process.on('unhandledRejection', (error): void => {
  handleUncaught(error, 'unhandledRejection')
})

// Termination signal sent by Docker on stop
process.on('SIGTERM', (): void => gracefulShutdown(0))
// Interrupt signal sent by Ctrl+C
process.on('SIGINT', (): void => gracefulShutdown(0))
