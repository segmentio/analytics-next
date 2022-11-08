import express from 'express'
import { nockRequests } from './nock'

// always run express in production mode just to be closer to our client's env -- logs less and consumes less memory.
process.env.NODE_ENV = 'production'

const { getBatchEventsTotal, getRequestTotal } = nockRequests()

export const startServer = (): Promise<express.Application> => {
  return new Promise((resolve) => {
    const app = express()
    const server = app.listen(3000, () => {
      console.log(`Listening on http://localhost:3000 in ${app.get('env')}`)
      resolve(app)
    })

    const onExit = () => {
      server.close(() => {
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
        console.log('Server closed.')
        process.exit()
      })
      setTimeout(() => {
        console.log('Force closing!')
        process.exit(1)
      }, 2000)
    }

    process.on('SIGINT', onExit)
    process.on('SIGTERM', onExit)
  })
}
