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
      console.log('\n closing server...')
      server.close(() => {
        console.log(`
        batch API events total: ${getBatchEventsTotal()}.
        batch API requests total: ${getRequestTotal()}.
      `)
        console.log('closed gracefully!')
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
