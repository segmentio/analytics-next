# @segment/analytics-node

https://www.npmjs.com/package/@segment/analytics-node

### OFFICIAL DOCUMENTATION (FULL)
- https://segment.com/docs/connections/sources/catalog/libraries/server/node

### LEGACY NODE SDK MIGRATION GUIDE:
- https://segment.com/docs/connections/sources/catalog/libraries/server/node/migration


## Runtime Support
- Node.js >= 20
- AWS Lambda
- Cloudflare Workers
- Vercel Edge Functions
- Web Workers / Browser (no device mode destination support)

## Quick Start

### Ferno

Ferno authenticates project API keys as Bearer tokens and ingests SDK batches
at `POST /events`. Configure the Node SDK as follows:

```ts
import { Analytics } from '@segment/analytics-node'

const analytics = new Analytics({
  writeKey: process.env.FERNO_API_KEY!,
  host: process.env.FERNO_API_URL ?? 'https://api.useferno.com',
  path: '/events',
  authMode: 'bearer',
})

analytics.track({ userId: 'user-123', event: 'signup' })
await analytics.closeAndFlush()
```

For local development, set `FERNO_API_URL=http://localhost:8080`. Ferno API
keys use the `ferno_pk_` prefix; keep them in environment variables.

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
See our [official documentation](https://segment.com/docs/connections/sources/catalog/libraries/server/node) for more examples and information.


## Settings & Configuration
See the documentation: https://segment.com/docs/connections/sources/catalog/libraries/server/node/#configuration

You can also see the complete list of settings in the [AnalyticsSettings interface](src/app/settings.ts).
