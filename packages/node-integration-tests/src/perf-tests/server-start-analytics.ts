import { Analytics } from '@segment/analytics-node'
import { startServer } from './server'
import { trackEventSmall } from './fixtures'

startServer()
  .then((app) => {
    const analytics = new Analytics({ writeKey: 'foo' })
    app.get('/', (_, res) => {
      analytics.track(trackEventSmall)
      res.sendStatus(200)
    })
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
