# @segment/analytics-node
> ### Warning: This library is in [public beta](https://segment.com/legal/first-access-beta-preview) ⚠️

https://www.npmjs.com/package/@segment/analytics-node

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

### Usage
Assuming some express-like web framework.
```ts
import { Analytics } from '@segment/analytics-node'
// or, if you use require:
const { Analytics } = require('@segment/analytics-node')

// instantiation
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
   res.sendStatus(201)
});
```


## Graceful Exit
Avoid losing events on exit!
 * Call `.closeAndFlush()` to stop collecting new events and flush all existing events.
  * If a callback on an event call is included, this also waits for all callbacks to be called, and any of their subsequent promises to be resolved.
```ts
await analytics.closeAndFlush()
// or
await analytics.closeAndFlush({ timeout: 5000 }) // force resolve after 5000ms
```
#### Advanced Example
```ts
const app = express()
const server = app.listen(3000)

const onExit = async () => {
  await analytics.closeAndFlush()
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

## Configuration Settings
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
## Regional configuration

For Business plans with access to Regional Segment, you can use the host configuration parameter to send data to the desired region:

Oregon (Default) — api.segment.io/v1
Dublin — events.eu1.segmentapis.com
An example of setting the host to the EU endpoint using the Node library would be:

```ts
const analytics = new Analytics({
  ...
  host: "https://events.eu1.segmentapis.com"
});
```

## Batching
Our libraries are built to support high performance environments. That means it is safe to use our Node library on a web server that’s serving thousands of requests per second.

Every method you call does not result in an HTTP request, but is queued in memory instead. Messages are then flushed in batch in the background, which allows for much faster operation.

By default, our library will flush:

- Every 15 messages (controlled by `settings.maxEventsInBatch`).
- If 10 seconds has passed since the last flush (controlled by `settings.flushInterval`)

There is a maximum of 500KB per batch request and 32KB per call.

If you don’t want to batch messages, you can turn batching off by setting the `maxEventsInBatch` setting to 1, like so:
```ts
const analytics = new Analytics({
  ...
  maxEventsInBatch: 1
});
```
Batching means that your message might not get sent right away. But every method call takes an optional callback, which you can use to know when a particular message is flushed from the queue, like so:

```ts
analytics.track({
    userId: '019mr8mf4r',
    event: 'Ultimate Played',
  },
  (err, ctx) => {
    ...
  }
)
```
## Error Handling
Subscribe and log all event delivery errors.
```ts
const analytics = new Analytics({ writeKey: '<MY_WRITE_KEY>' })

analytics.on('error', (err) => console.error(err))
```



## Event Emitter Interface
You can see the complete list of emitted events in [emitter.ts](src/app/emitter.ts)
```ts
analytics.on('error', (err) => console.error(err))

analytics.on('identify', (ctx) => console.log(ctx))

analytics.on('track', (ctx) => console.log(ctx))

```
#### You can use the emitter to log all HTTP Requests
```ts
analytics.on('http_request', (event) => console.log(event))

// when triggered, emits an event of the shape:
{
    url: 'https://api.segment.io/v1/batch',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...
    },
    body: '...',
}

```


## Multiple Clients
Different parts of your application may require different types of batching, or even sending to multiple Segment sources. In that case, you can initialize multiple instances of Analytics with different settings:

```ts
const marketingAnalytics = new Analytics({ writeKey: 'MARKETING_WRITE_KEY' });
const appAnalytics = new Analytics({ writeKey: 'APP_WRITE_KEY' });
```

## Troubleshooting
1. Double check that you’ve followed all the steps in the Quick Start.

2. Make sure that you’re calling a Segment API method once the library is successfully installed: identify, track, etc.

3. Log events.
```js
['initialize', 'call_after_close',
 'screen', 'identify', 'group',
 'track', 'ready', 'alias',
 'page', 'error', 'register',
 'deregister'].forEach((event) => analytics.on(event, console.log)
```

## Development: Disabling Analytics for Tests
- If you want to intercept / disable analytics for integration tests, you can use something like [nock](https://github.com/nock/nock)

```ts
// Note: nock will _not_ work if polyfill fetch with something like undici, as nock uses the http module. Undici has its own interception method.
import nock from 'nock'

nock('https://api.segment.io')
  .post('/v1/batch')
  .reply(201)
  .persist()
```


## Differences from legacy analytics-node / Migration Guide


- Named imports.
```ts
// old
import Analytics from 'analytics-node'

// new
import { Analytics } from '@segment/analytics-node'
```

- Instantiation now requires an _object_ as the first argument.
```ts
// old
var analytics = new Analytics('YOUR_WRITE_KEY'); // not supported

// new!
const analytics = new Analytics({ writeKey: '<MY_WRITE_KEY>' })
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
- `callback` call signature is different
```ts
// old
(err, batch) => void
// new
(err, ctx) => void
```
- Undocumented behavior around `track` properties have been removed.
```ts
  // old, undocumented behavior
 analytics.track({
  ...
  event: 'Ultimate Played',
  myProp: 'abc'
})

// new
 analytics.track({
  ...
  event: 'Ultimate Played',
  properties:  {
    myProp: 'abc'
  }
})
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

## Selecting Destinations
The alias, group, identify, page and track calls can all be passed an object of integrations that lets you turn certain destinations on or off. By default all destinations are enabled.

Here’s an example with the integrations object shown:
```ts
analytics.track({
  event: 'Membership Upgraded',
  userId: '97234974',
  integrations: {
    'All': false,
    'Vero': true,
    'Google Analytics': false
  }
})
```

In this case, we’re specifying that we want this track to only go to Vero. All: false says that no destination should be enabled unless otherwise specified. Vero: true turns on Vero, etc.

Destination flags are case sensitive and match the [destination’s name in the docs](https://segment.com/docs/connections/destinations) (i.e. “AdLearn Open Platform”, “awe.sm”, “MailChimp”, etc.). In some cases, there may be several names for a destination; if that happens you’ll see a “Adding (destination name) to the Integrations Object” section in the destination’s doc page with a list of valid names.

Note:

- Available at the business level, filtering track calls can be done right from the Segment UI on your source schema page. We recommend using the UI if possible since it’s a much simpler way of managing your filters and can be updated with no code changes on your side.

- If you are on a grandfathered plan, events sent server-side that are filtered through the Segment dashboard will still count towards your API usage.

## Usage in AWS Lambda
- [AWS lambda execution environment](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html) is challenging for typically non-response-blocking async activites like tracking or logging, since the runtime terminates / freezes after a response is emitted.

Here is an example of using analytics.js within a handler:
```ts
const { Analytics } = require("@segment/analytics-node");

// since analytics has the potential to be stateful if there are any plugins added,
// to be on the safe side, we should instantiate a new instance of analytics on every request (the cost of instantiation is low).
const analytics = () => new Analytics({
      maxEventsInBatch: 1,
      writeKey: '<MY_WRITE_KEY>',
    })
    .on("error", console.error);

module.exports.handler = async (event) => {
  ...
  // we need to await before returning, otherwise the lambda will exit before sending the request.
  await new Promise((resolve) =>
    analytics().track({ event: 'My Event', anonymousId: 'foo' }, resolve)
   )

  return {
    statusCode: 200,
  };
  ....
};
```
