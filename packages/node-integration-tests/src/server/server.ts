import express from 'express'
import { Server } from 'http'
import { nockRequests } from './nock'

// always run express in production mode just to be closer to our client's env -- logs less and consumes less memory.
process.env.NODE_ENV = 'production'

const { getBatchEventsTotal, getRequestTotal } = nockRequests()

const onServerClose = (
  server: Server,
  onCloseCb?: ServerOptions['onClose']
) => {
  server.close(async () => {
    console.log('Server closing...')
    await onCloseCb?.()
    const totalBatchEvents = getBatchEventsTotal()
    const totalApiRequests = getRequestTotal()
    const averagePerBatch = totalApiRequests
      ? (totalBatchEvents / totalApiRequests).toFixed(1)
      : 0
    console.log(`
      batch API events total: ${totalBatchEvents}.
      batch API requests total: ${totalApiRequests}.
      average events per batch: ${averagePerBatch}
    `)
    process.exit(0)
  })
}

const PORT = 3000

type ServerOptions = {
  onClose?: () => void | Promise<void>
}

export const startServer = (
  options: ServerOptions = {}
): Promise<express.Application> => {
  return new Promise((resolve) => {
    const app = express()
    const server = app.listen(PORT, () => {
      console.log(`Listening on http://localhost:${PORT} in ${app.get('env')}`)
      resolve(app)
    })
    ;['SIGINT', 'SIGTERM'].forEach((signal) => {
      process.on(signal, () => onServerClose(server, options.onClose))
    })
  })
}
