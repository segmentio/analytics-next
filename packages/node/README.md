# TODO: API Documentation is out of date

https://segment.com/docs/connections/sources/catalog/libraries/server/node/


NOTE:  @segment/analytics-node is unstable! do not use.

## Basic Usage
```ts
// analytics.ts
import { AnalyticsNode } from '@segment/analytics-node'

export const analytics = new AnalyticsNode({ writeKey: '<MY_WRITE_KEY>' })


// app.ts
import { analytics } from './analytics'

analytics.identify('Test User', { loggedIn: true }, { userId: "123456" })
analytics.track('hello world', {}, { userId: "123456" })

```

# Event Emitter (Advanced Usage)
```ts
// listen globally to events
analytics.on('identify', (ctx) => console.log(ctx.event))
```

