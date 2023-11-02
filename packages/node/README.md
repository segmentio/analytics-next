Customer.io Data Pipelines analytics client for Node.js.

## Installation

```
npm install @customerio/cdp-analytics-node
```

## Usage

```ts
import { Analytics } from '@customerio/cdp-analytics-node'

// instantiation
const analytics = new Analytics({ writeKey: '<MY_WRITE_KEY>' });

analytics.identify({
  userId: '4'
});
```

## Other Regions

If you're using a [different data center](https://customer.io/docs/accounts-and-workspaces/data-centers/) such as our EU region, you can specify an alternate endpoint:

```ts
import { Analytics } from '@customerio/cdp-analytics-node'

// instantiation
const analytics = new Analytics({
  host: 'https://cdp-eu.customer.io',
  writeKey: '<MY_WRITE_KEY>'
});

analytics.identify({
  userId: '4'
});
```

## Documentation

The links below contain more detailed documentation on how to use this library:

* [Documentation](https://customer.io/docs/cdp/sources/connections/servers/node/)
* [Specs](https://customer.io/docs/cdp/sources/source-spec/source-events/)
* [npm](https://www.npmjs.com/package/@customerio/cdp-analytics-node)
