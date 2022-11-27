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
## Regional configuration

For Business plans with access to Regional Segment, you can use the host configuration parameter to send data to the desired region:

Oregon (Default) — api.segment.io/v1
Dublin — events.eu1.segmentapis.com
An example of setting the host to the EU endpoint using the Node library would be:

```ts
const analytics = new Analytics('YOUR_WRITE_KEY', {
    host: "https://events.eu1.segmentapis.com"
});
```

## Complete Settings / Configuration
See complete list of settings in the [AnalyticsSettings interface](src/app/settings.ts).
```ts
const analytics = new Analytics({
    writeKey: '<MY_WRITE_KEY>',
    host: 'https://api.segment.io',
    path: '/v1/batch',
    maxRetries: 3,
    maxEventsInBatch: 15,
    flushInterval: 10000,
    // ... and more!
  })

```

## Batching
Our libraries are built to support high performance environments. That means it is safe to use our Node library on a web server that’s serving thousands of requests per second.

Every method you call does not result in an HTTP request, but is queued in memory instead. Messages are then flushed in batch in the background, which allows for much faster operation.

By default, our library will flush:

- The very first time it gets a message.
- Every 15 messages (controlled by `settings.maxEventsInBatch`).
- If 10 seconds has passed since the last flush (controlled by `settings.flushInterval`)

There is a maximum of 500KB per batch request and 32KB per call.

If you don’t want to batch messages, you can turn batching off by setting the `maxEventsInBatch` setting to 1, like so:
```ts
const analytics = new Analytics({ '<MY_WRITE_KEY>', { maxEventsInBatch: 1 });
```
Batching means that your message might not get sent right away. But every method call takes an optional callback, which you can use to know when a particular message is flushed from the queue, like so:

```ts
analytics.track({
  userId: '019mr8mf4r',
  event: 'Ultimate Played'
  callback: (ctx) => console.log(ctx)
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

3. Log events and errors the event emitter:
```js
['initialize', 'call_after_close',
 'screen', 'identify', 'group',
 'track', 'ready', 'alias',
 'page', 'error', 'register',
 'deregister'].forEach((event) => analytics.on(event, console.log)
```


## Differences from legacy analytics-node / Migration Guide


- Named imports.
```ts
// old
import Analytics from 'analytics-node'

// new
import { Analytics } from '@segment/analytics-next'
```

- Instantiation requires an object
```ts
// old

var analytics = new Analytics('YOUR_WRITE_KEY');

// new
const analytics = new Analytics({ writeKey: 'YOUR_WRITE_KEY' });

```
- Graceful shutdown (See Graceful Shutdown section)
```ts
  // old
  await analytics.flush(function(err, batch) {
    console.log('Flushed, and now this program can exit!');
  });

  // new
  await analytics.closeAndFlush()
```

Other Differences:

- The `enable` configuration option has been removed-- see "Disabling Analytics" section
- the `errorHandler` configuration option has been remove  -- see "Error Handling" section
- `flushAt` configuration option -> `maxEventsInBatch`.
- `callback` option is moved to configuration
```ts
// old
analytics.track({
  userId: '019mr8mf4r',
  event: 'Ultimate Played'
}), function(err, batch){
  if (err) {
    console.error(err)
  }
});

// new
analytics.track({
  userId: '019mr8mf4r',
  event: 'Ultimate Played',
  callback: (ctx) => {
     if (ctx.failedDelivery()) {
        console.error(ctx)
     }
  }
})

```


## Development / Disabling Analytics
- If you want to disable analytics for unit tests, you can use something like [nock](https://github.com/nock/nock) or [jest mocks](https://jestjs.io/docs/manual-mocks).

You should prefer mocking. However, if you need to intercept the request, you can do:

```ts
  // Note: nock will _not_ work if polyfill fetch with something like undici, as nock uses the http module. Undici has its own interception method.
  import nock from 'nock'

  const mockApiHost = 'https://foo.bar'
  const mockPath = '/foo'

  nock(mockApiHost) // using regex matching in nock changes the perf profile quite a bit
    .post(mockPath, (body) => true)
    .reply(201)
    .persist()

const analytics = new Analytics({ host: mockApiHost, path: mockPath })

```


## Plugin Architecture
- See segment's [documentation for plugin architecture](https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/#plugin-architecture).

```ts
import type { Plugin } from '@segment/analytics-node'
export const lowercase: Plugin = {
  name: 'Lowercase events',
  type: 'enrichment',
  version: '1.0.0',
  isLoaded: () => true,
  load: () => Promise.resolve(),
  track: (ctx) => {
    ctx.updateEvent('event', ctx.event.event.toLowerCase())
    return ctx
  }
}

analytics.register(lowercase)

```
