import { startServer } from './server'

startServer()
  .then((app) => {
    app.get('/', (_, res) => {
      res.sendStatus(200)
    })
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
