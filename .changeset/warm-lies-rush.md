---
'@segment/analytics-signals': minor
---

Allow registration of middleware

```ts
class MyMiddleware implements SignalsMiddleware {
  process(signal: Signal) {
    if (
      signal.type === 'network' &&
      signal.data.action === 'request' &&
      signal.data.contentType.includes('api-keys')
    ) {
      // drop signal
      return null
    } else {
      return signal
    }
  }
}
signalsPlugin.register(new MyMiddleware())
```
