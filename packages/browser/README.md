Customer.io Data Pipelines analytics client for browsers.

## Installation

```
npm install @customerio/cdp-analytics-browser
```

## Usage

```ts
import { AnalyticsBrowser } from '@customerio/cdp-analytics-browser'

const analytics = AnalyticsBrowser.load({ writeKey: '<YOUR_WRITE_KEY>' })

analytics.identify('hello world')

document.body?.addEventListener('click', () => {
  analytics.track('document body clicked!')
})
```

## Other Regions

If you're in our [EU data center](https://customer.io/docs/accounts-and-workspaces/data-centers/) you will need to specify an alternate endpoint:

```ts
import { AnalyticsBrowser } from '@customerio/cdp-analytics-browser'

const analytics = AnalyticsBrowser.load({
  cdnURL: 'https://cdp-eu.customer.io',
  writeKey: '<YOUR_WRITE_KEY>'
})

analytics.identify('hello world')
```
