---
'@segment/analytics-next': minor
---
Add new `headers` setting, along with `fetchPriority`.

```ts
analytics.load("<YOUR_WRITE_KEY>",
  {
    integrations: {
      'Segment.io': {
        deliveryStrategy: {
          strategy: "standard" // also works for 'batching'
          config: {
            headers: { 'x-api-key': 'foo' } or () => {...}
            priority: 'low',
          },
        },
      },
    },
  }
)

```
