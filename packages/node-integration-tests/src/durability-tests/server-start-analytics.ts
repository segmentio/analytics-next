import { Analytics } from '@segment/analytics-node'
import { startServer } from '../server/server'
import { trackEventSmall } from '../server/fixtures'

const analytics = new Analytics({
  writeKey: 'foo',
  flushInterval: 1000,
  maxEventsInBatch: 15,
})

startServer({ onClose: analytics.closeAndFlush })
  .then((app) => {
    app.get('/', (_, res) => {
      analytics.track(trackEventSmall)
      res.sendStatus(200)
    })
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
