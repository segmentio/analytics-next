Customer.io Data Pipelines analytics client for browsers.

## Installation

```
npm install @customerio/cdp-analytics-js
```

## Usage

```ts
import { AnalyticsBrowser } from '@customerio/cdp-analytics-js'

const analytics = AnalyticsBrowser.load({ writeKey: '<YOUR_WRITE_KEY>' })

analytics.identify('hello world')

document.body?.addEventListener('click', () => {
  analytics.track('document body clicked!')
})
```
