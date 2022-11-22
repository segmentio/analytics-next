# @segment/analytics-node
> ### Warning: Until 1.x release, use this library at your own risk!
While the API is very similar, the documentation for the legacy SDK (`analytics-node`) is here: https://segment.com/docs/connections/sources/catalog/libraries/server/node/

## Requirements
- Node.js >= 14

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
import { Analytics } from '@segment/analytics-node'

const analytics = new Analytics({ writeKey: '<MY_WRITE_KEY>' })

app.post('/login', (req, res) => {
   analytics.identify({
      userId: req.body.userId,
      previousId: req.body.previousId
  })
  res.sendStatus(200)
})

app.post('/cart', (req, res) => {
  analytics.track({
    userId: req.body.userId,
    event: 'Add to cart',
    properties: { productId: '123456' }
  })
   res.sendStatus(200)
});
```

## Complete Settings / Configuration
See complete list of settings in the [AnalyticsSettings interface](src/app/settings.ts).
```ts
const analytics = new Analytics({
    writeKey: '<MY_WRITE_KEY>',
    plugins: [plugin1, plugin2],
    host: 'https://api.segment.io',
    path: '/v1/batch',
    maxRetries: 3,
    maxEventsInBatch: 15,
    flushInterval: 10000,
    // ... and more!
  })

```

## Error Handling
Subscribe and log all event delivery errors.
```ts
const analytics = new Analytics({ writeKey: '<MY_WRITE_KEY>' })

analytics.on('error', (err) => console.error(err))
```


## Graceful Shutdown (Long or short running processes)

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
import { Analytics } from '@segment/analytics-node'
import express from 'express'

const analytics = new Analytics({ writeKey: '<MY_WRITE_KEY>' })

const app = express()

app.post('/cart', (req, res) => {
  analytics.track({
    userId: req.body.userId,
    event: 'Add to cart',
    properties: { productId: '123456' }
  })
  res.sendStatus(200)
})

const server = app.listen(3000)

const onExit = async () => {
  await analytics.closeAndFlush() // flush all existing events
  server.close(() => {
    console.log("Gracefully closing server...")
    process.exit()
  })
}

['SIGINT', 'SIGTERM'].forEach((code) => process.on(code, onExit))

```

#### Collecting unflushed events
If you absolutely need to preserve all possible events in the event of a forced timeout, even ones that came in after  `analytics.closeAndFlush()` was called, you can collect those events.
```ts
const unflushedEvents = []

analytics.on('call_after_close', (event) => unflushedEvents.push(events))
await analytics.closeAndFlush()

console.log(unflushedEvents) // all events that came in after closeAndFlush was called

```


## Event Emitter Interface
```ts
// subscribe to identify calls
analytics.on('identify', (err) => console.error(err))

// subscribe to a specific event
analytics.on('track', (ctx) => console.log(ctx))
```


## Multiple Clients
Different parts of your application may require different types of batching, or even sending to multiple Segment sources. In that case, you can initialize multiple instances of Analytics with different settings:

```ts
import { Analytics } from '@segment/analytics-node'

const marketingAnalytics = new Analytics('MARKETING_WRITE_KEY');
const appAnalytics = new Analytics('APP_WRITE_KEY');
```

## Troubleshooting
1. Double check that you’ve followed all the steps in the Quick Start.

2. Make sure that you’re calling a Segment API method once the library is successfully installed: identify, track, etc.

3. Log events and errors using the event emitter:
```ts
['initialize', 'call_after_close',
 'screen', 'identify', 'group',
 'track', 'ready', 'alias',
 'page', 'error', 'register',
 'deregister'].forEach((event) => analytics.on(event, console.log)
```
