import express from 'express'
import nock from 'nock'
import process from 'process'

nock.disableNetConnect()
nock('https://api.segment.io') // using regex matching in nock changes the perf profile quite a bit
  .post('/v1/batch')
  .reply(201)
  .persist()

nock('https://api.segment.io') // using regex matching in nock changes the perf profile quite a bit
  .post('/v1/track')
  .reply(201)
  .persist()

export const startServer = (): Promise<express.Application> => {
  return new Promise((resolve) => {
    const app = express()

    const server = app.listen(3000, () => {
      console.log('Listening on http://localhost:3000')
    })

    const onExit = () => {
      console.log('closing server...')
      server.close(() => {
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
    resolve(app)
  })
}
