# @segment/analytics-node

https://www.npmjs.com/package/@segment/analytics-node

### OFFICIAL DOCUMENTATION (FULL)
- https://segment.com/docs/connections/sources/catalog/libraries/server/node

### LEGACY NODE SDK MIGRATION GUIDE:
- https://segment.com/docs/connections/sources/catalog/libraries/server/node/migration


## Runtime Support
- Node.js >= 18
- AWS Lambda
- Cloudflare Workers
- Vercel Edge Functions
- Web Workers / Browser (no device mode destination support)

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



## Usage in non-node runtimes
### Usage in AWS Lambda
- [AWS lambda execution environment](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html) is challenging for typically non-response-blocking async activites like tracking or logging, since the runtime terminates / freezes after a response is emitted.

Here is an example of using analytics.js within a handler:
```ts
const { Analytics } = require('@segment/analytics-node');

 // Preferable to create a new analytics instance per-invocation. Otherwise, we may get a warning about overlapping flush calls. Also, custom plugins have the potential to be stateful, so we prevent those kind of race conditions.
const createAnalytics = () => new Analytics({
      writeKey: '<MY_WRITE_KEY>',
    }).on('error', console.error);

module.exports.handler = async (event) => {
  const analytics = createAnalytics()

  analytics.identify({ ... })
  analytics.track({ ... })

  // ensure analytics events get sent before program exits
  await analytics.flush()

  return {
    statusCode: 200,
  };
  ....
};
```

### Usage in Vercel Edge Functions

```ts
import { Analytics } from '@segment/analytics-node';
import { NextRequest, NextResponse } from 'next/server';

const createAnalytics = () => new Analytics({
  writeKey: '<MY_WRITE_KEY>',
}).on('error', console.error)

export const config = {
  runtime: 'edge',
};

export default async (req: NextRequest) => {
  const analytics = createAnalytics()

  analytics.identify({ ... })
  analytics.track({ ... })

  // ensure analytics events get sent before program exits
  await analytics.flush()

  return NextResponse.json({ ... })
};
```

### Usage in Cloudflare Workers

```ts
import { Analytics, Context } from '@segment/analytics-node';


const createAnalytics = () => new Analytics({
  writeKey: '<MY_WRITE_KEY>',
}).on('error', console.error);

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const analytics = createAnalytics()

    analytics.identify({ ... })
    analytics.track({ ... })

    // ensure analytics events get sent before program exits
    await analytics.flush()

    return new Response(...)
  },
};

```

### OAuth 2
In order to guarantee authorized communication between your server environment and Segment's Tracking API, you can [enable OAuth 2 in your Segment workspace](https://segment.com/docs/partners/enable-with-segment/).  To support the non-interactive server environment, the OAuth workflow used is a signed client assertion JWT.  You will need a public and private key pair where the public key is uploaded to the segment dashboard and the private key is kept in your server environment to be used by this SDK. Your server will verify its identity by signing a token request and will receive a token that is used to to authorize all communication with the Segment Tracking API.

You will also need to provide the OAuth Application ID and the public key's ID, both of which are provided in the Segment dashboard.  You should ensure that you are implementing handling for Analytics SDK errors.  Good logging will help distinguish any configuration issues.

```ts
import { Analytics, OAuthSettings } from '@segment/analytics-node';
import { readFileSync } from 'fs'

const privateKey = readFileSync('private.pem', 'utf8')

const settings: OAuthSettings = {
  clientId: '<CLIENT_ID_FROM_DASHBOARD>',
  clientKey: privateKey,
  keyId: '<PUB_KEY_ID_FROM_DASHBOARD>',
}

const analytics = new Analytics({
  writeKey: '<MY_WRITE_KEY>',
  oauthSettings: settings,
}).on('error', console.error)

analytics.track({ userId: 'foo', event: 'bar' })
```
