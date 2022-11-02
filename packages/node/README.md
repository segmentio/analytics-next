
## Warning: Until 1.x release, use this library at your own risk!
While the API is very similar, the documentation for the legacy SDK (`analytics-node`) is here: https://segment.com/docs/connections/sources/catalog/libraries/server/node/


## Quick Start
### Install library
```bash
# npm
npm install @segment/analytics-node
# yarn
yarn add @segment/analytics-node
# pnpm
pnpm install @segment/analytics-node
```

### Usage (assuming some express-like web framework)
```ts
import { AnalyticsNode } from '@segment/analytics-node'

const analytics = new AnalyticsNode({ writeKey: '<MY_WRITE_KEY>' })


app.post('/login', (req, res) => {
   analytics.identify({
      userId: req.body.userId,
      previousId: req.body.previousId
  })
})

app.post('/cart', (req, res) => {
  analytics.track({
    userId: req.body.userId,
    event: 'Add to cart',
    properties: { productId: '123456' }
  })
});
```

## Graceful Shutdown
### Avoid losing events on exit!
 * Call `.closeAndFlush()` to stop collecting new events and flush all existing events.
  * If a callback on an event call is included, this also waits for all callbacks to be called, and any of their subsequent promises to be resolved.
```ts
await analytics.closeAndFlush()
// or
await analytics.closeAndFlush({ timeout: 5000 }) // force resolve after 5000ms
```
### Graceful Shutdown: Advanced Example
```ts
import { AnalyticsNode } from '@segment/analytics-node'
import express from 'express'

const analytics = new AnalyticsNode({ writeKey: '<MY_WRITE_KEY>' })

const app = express()
app.post('/cart', (req, res) => {
  analytics.track({
    userId: req.body.userId,
    event: 'Add to cart',
    properties: { productId: '123456' }
  })
});

const server = app.listen(3000)


const onExit = async () => {
  console.log("Gracefully closing server...");
  await analytics.closeAndFlush() // flush all existing events
  server.close(() => process.exit());
};

process.on("SIGINT", onExit);
process.on("SIGTERM", onExit);
```

#### Collecting unflushed events
If you absolutely need to preserve all possible events in the event of a forced timeout, even ones that came in after  `analytics.closeAndFlush()` was called, you can collect those events.
```ts
const unflushedEvents = []

analytics.on('call_after_close', (event) => unflushedEvents.push(events))
await analytics.closeAndFlush()

console.log(unflushedEvents) // all events that came in after closeAndFlush was called

```


## Event Emitter
```ts
// listen globally to events
analytics.on('identify', (ctx) => console.log(ctx.event))

// listen for errors (if needed)
analytics.on('error', (err) => console.error(err))

```


