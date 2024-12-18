---
'@segment/analytics-next': minor
---
Add new `additionalHeaders` setting, along with `fetchPriority`.

```ts
analytics.load("<YOUR_WRITE_KEY>",
  {
    integrations: {
      'Segment.io': {
        deliveryStrategy: {
          strategy: "standard" // also works for 'batching'
          config: {
            additionalHeaders: { 'x-api-key': 'foo' } or () => {...}
            fetchPriority: 'low' | 'high', // new setting
          },
        },
      },
    },
  }
)

```
