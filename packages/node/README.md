Customer.io Data Pipelines analytics client for Node.js.

## Installation

```
npm install @customerio/cdp-analytics-node
```

## Usage

```ts
import { Analytics } from '@customerio/cdp-analytics-node'

// instantiation
const analytics = new Analytics({ writeKey: '<MY_WRITE_KEY>' })

analytics.identify({
  userId: '4'
});
```
