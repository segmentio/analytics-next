## Ferno SDK

This directory contains Ferno's web and Node.js integrations built on top of
the Segment Analytics SDK packages.


<div style="display:flex;margin-bottom:5px">
  <span style="margin: 0 5px 5px">
    <a href="https://github.com/segmentio/analytics-next/actions/workflows/ci.yml">
    <img src="https://github.com/segmentio/analytics-next/actions/workflows/ci.yml/badge.svg?branch=master">
  </a>

  </span>
  <span style="margin:0 5px 5px">
    <a href="http://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg">
  </span>
</div>
<br />

<p align="center">
  <a href="https://segment.com">
    <img src="img/twilio-segment-logo-2x.png" width="300">
  </a>
  <br />
  <caption>Welcome to the monorepo for Segment's latest Javascript / Typescript SDKs</caption>
</p>

# analytics.js (analytics-next)

## Packages

- [@segment/analytics-next](packages/browser#readme): Analytics.js SDK for **web browsers**
- [@segment/analytics-node](packages/node#readme): Analytics.js SDK for **Node.js**

## Using with Ferno

Ferno's ingestion API is `POST /events`. It authenticates project API keys as
Bearer tokens and accepts the SDK batch envelope. API keys are project-scoped,
have the `ferno_pk_` prefix, and are returned only once when created.

Set the API URL to your Ferno deployment. The examples use the production API
URL; for local development use `http://localhost:8080`.

### Web

Install the browser SDK:

```sh
npm install @segment/analytics-next
```

Configure Ferno as the Segment.io transport. Supplying `cdnSettings` keeps the
SDK from requesting source settings from Segment's CDN.

```ts
import { AnalyticsBrowser } from '@segment/analytics-next'

const FERNO_API_URL = 'https://api.useferno.com'
const FERNO_API_KEY = 'ferno_pk_your_project_key'

export const analytics = AnalyticsBrowser.load(
  {
    writeKey: FERNO_API_KEY,
    cdnSettings: {
      integrations: {
        'Segment.io': { apiKey: FERNO_API_KEY },
      },
    },
  },
  {
    integrations: {
      'Segment.io': {
        apiHost: FERNO_API_URL,
        apiPath: '/events',
        authMode: 'bearer',
        deliveryStrategy: {
          strategy: 'batching',
          config: { size: 10, timeout: 5000 },
        },
      },
    },
  }
)

analytics.track('signup', { plan: 'pro' })
analytics.identify('user-123', { email: 'user@example.com' })
```

The browser API must allow CORS requests from the application origin. Never
embed a credential that is not intended for browser use.

### Node.js

Install the Node SDK:

```sh
npm install @segment/analytics-node
```

Use the Ferno project API key as a Bearer token and route batches to
`/events`:

```ts
import { Analytics } from '@segment/analytics-node'

const analytics = new Analytics({
  writeKey: process.env.FERNO_API_KEY!,
  host: process.env.FERNO_API_URL ?? 'https://api.useferno.com',
  path: '/events',
  authMode: 'bearer',
  flushAt: 10,
})

analytics.track({
  userId: 'user-123',
  event: 'signup',
  properties: { plan: 'pro' },
})

await analytics.closeAndFlush()
```

For local development:

```sh
FERNO_API_URL=http://localhost:8080
FERNO_API_KEY=ferno_pk_your_project_key
```

The API accepts `track`, `identify`, `page`, `screen`, `group`, and `alias`
events. Keep API keys out of source control and rotate revoked keys.

## Contributing

- Contribution guidelines: [CONTRIBUTING.md](CONTRIBUTING.md)
- Development instructions: [DEVELOPMENT.md](DEVELOPMENT.md)
- Releasing (to npm): [RELEASING.md](RELEASING.md)
