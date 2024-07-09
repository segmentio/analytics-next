#  @segment/analytics-signals 


## Settings / Configuration

See: [settings.ts](src/types/settings.ts)

## Quick start
### Installation
```bash
# npm
npm install @segment/analytics-signals
# yarn
yarn add @segment/analytics-signals
# pnpm
pnpm install @segment/analytics-signals
```

```ts
// analytics.js/ts
import { AnalyticsBrowser } from '@segment/analytics-next'
import { SignalsPlugin } from '@segment/analytics-signals'

const analytics = new AnalyticsBrowser()
analytics.register(new SignalsPlugin())

analytics.load({
  writeKey: '<YOUR_WRITE_KEY>'
})

```

### Debugging
- Removing obfuscation / redaction of data by adding a magic **query string**:
```
https://my-website.com?segment_signals_debug=true
```

### Playground / Development / Testing
See the [signals example repo](../signals-example).

## Signal Types

### `interaction`
Interaction signals emit in response to a user interaction

### `instrumentation`
Instrumentation signals emit whenever a Segment event is emitted.

### `navigation`
Instrumentation signals emit whenever the URL changes.

> Note: you can also rely on the initial analytics.page() call, which you can access as an Instrumentation signal.

### `network`
Network signals emit when an HTTP Request is made, or an HTTP Response is received. To emit a network signal, the network activity must have the following requirements:
- Initiated using the `fetch` API
- First party domain (e.g if on `foo.com`, then `foo.com/api/products`, but not `bar.com/api/products`)
- Contains the content-type: `application/json`

