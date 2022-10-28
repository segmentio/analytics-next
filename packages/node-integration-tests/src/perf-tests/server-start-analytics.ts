import { AnalyticsNode } from '@segment/analytics-node'
import { startServer } from './server'

startServer()
  .then((app) => {
    const analytics = new AnalyticsNode({ writeKey: 'fooo' })
    app.get('/', (_, res) => {
      analytics.track({ userId: 'foo', event: 'click' })
      res.sendStatus(200)
    })
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
