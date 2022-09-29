# TODO: API Documentation is out of date

https://segment.com/docs/connections/sources/catalog/libraries/server/node/


NOTE:  @segment/analytics-node is unstable! do not use.

## Quick Start
```ts
// analytics.ts
import { AnalyticsNode } from '@segment/analytics-node'

export const analytics = new AnalyticsNode({ writeKey: '<MY_WRITE_KEY>' })


// app.ts
import { analytics } from './analytics'

analytics.identify('Test User', { loggedIn: true }, { userId: "123456" })
analytics.track('hello world', {}, { userId: "123456" })

```

## Graceful Shutdown
### Avoid losing events on exit!
 * Call `.closeAndFlush()` to stop collecting new events and flush all existing events.
  * If a callback on an event call is included, this also waits for all callbacks to be called, and any of their subsequent promises to be resolved.
```ts
await analytics.closeAndFlush()
// or
await analytics.closeAndFlush({ timeout: 5000 }) // automatically closes after 5000ms
```
### Graceful Shutdown: Advanced Example
```ts
import express from 'express'
const app = express()

const server = app.listen(3000)
app.get('/', (req, res) => res.send('Hello World!'));

const onExit = () => {
  setTimeout(async () => {
    await analytics.closeAndFlush() // flush all existing events
    server.close(() => process.exit())
  }, 0);
};

process.on('SIGINT', onExit)
process.on('SIGTERM', onExit);

```

## Event Emitter
```ts
import { analytics } from './analytics'
import { ContextCancelation, CoreContext } from '@segment/analytics-node'

// listen globally to events
analytics.on('identify', (ctx) => console.log(ctx.event))

// listen for errors (if needed)
analytics.on('error', (err) => {
  if (err.code === 'http_delivery') {
    console.error(err.response)
  } else {
    console.error(err)
  }
})
```


