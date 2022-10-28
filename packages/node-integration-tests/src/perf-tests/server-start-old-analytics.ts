import Analytics from 'analytics-node'
import { startServer } from './server'

startServer()
  .then((app) => {
    const analytics = new Analytics('foo')
    app.get('/', (_, res) => {
      analytics.track({
        userId: '019mr8mf4r',
        event: 'Order Completed',
        properties: { price: 99.84 },
      })

      res.sendStatus(200)
    })
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
