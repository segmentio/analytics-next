# @segment/analytics-node

https://www.npmjs.com/package/@segment/analytics-node

### OFFICIAL DOCUMENTATION (FULL)
- https://segment.com/docs/connections/sources/catalog/libraries/server/node

### LEGACY NODE SDK MIGRATION GUIDE:
- https://segment.com/docs/connections/sources/catalog/libraries/server/node/migration


## Runtime Support
- Node.js >= 14
- AWS Lambda
- Cloudflare Workers
- Vercel Edge Functions
- Web Workers (experimental)

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


## Settings & Configuration 
See the documentation: https://segment.com/docs/connections/sources/catalog/libraries/server/node/#configuration

You can also see the complete list of settings in the [AnalyticsSettings interface](src/app/settings.ts).


## Plugin Architecture
- See segment's [documentation for plugin architecture](https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/#plugin-architecture).



## Usage in AWS Lambda
- [AWS lambda execution environment](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html) is challenging for typically non-response-blocking async activites like tracking or logging, since the runtime terminates / freezes after a response is emitted.

Here is an example of using analytics.js within a handler:
```ts
const { Analytics } = require('@segment/analytics-node');

// since analytics has the potential to be stateful if there are any plugins added,
// to be on the safe side, we should instantiate a new instance of analytics on every request (the cost of instantiation is low).
const analytics = () => new Analytics({
      maxEventsInBatch: 1,
      writeKey: '<MY_WRITE_KEY>',
    })
    .on('error', console.error);

module.exports.handler = async (event) => {
  ...
  // we need to await before returning, otherwise the lambda will exit before sending the request.
  await new Promise((resolve) =>
    analytics().track({ ... }, resolve)
   )

  ...
  return {
    statusCode: 200,
  };
  ....
};
```

## Usage in Vercel Edge Functions
```ts
import { Analytics } from '@segment/analytics-node';
import { NextRequest, NextResponse } from 'next/server';

export const analytics = new Analytics({
  writeKey: 'DjTUVRhleGaZX31JQpj6XIAaprCIb25W',
  maxEventsInBatch: 1,
})
  .on('error', console.error)

export const config = {
  runtime: 'edge',
};

export default async (req: NextRequest) => {
  await new Promise((resolve) =>
    analytics.track({ ... }, resolve)
  );
  return NextResponse.json({ ... })
};
```

## Usage in Cloudflare Workers
```ts
import { Analytics, Context } from '@segment/analytics-node';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const analytics = new Analytics({
      maxEventsInBatch: 1,
      writeKey: '<MY_WRITE_KEY>',
    }).on('error', console.error);

    await new Promise((resolve, reject) =>
      analytics.track({ ... }, resolve)
    );
    
    ...
    return new Response(...)
  },
};

```


