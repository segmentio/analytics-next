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
await analytics.closeAndFlush({ timeout: 5000 }) // force resolve after 5000ms
```
### Graceful Shutdown: Advanced Example
```ts
import { AnalyticsNode } from '@segment/analytics-node'
import express from 'express'

const analytics = new AnalyticsNode({ writeKey: '<MY_WRITE_KEY>' })

const app = express()
app.get('/', (req, res) => res.send('Hello World!'));

const server = app.listen(3000)


const onExit = async () => {
  console.log("Gracefully closing server...");

  await analytics.closeAndFlush() // flush all existing events

  server.close(() => process.exit());

  setTimeout(() => {
    console.log("Force closing server!");
    process.exit(1);
  }, 5000);
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


