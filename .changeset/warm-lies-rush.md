---
'@segment/analytics-signals': minor
---

Allow registration of middleware to allow for dropping and modification of signals

```ts
class MyMiddleware implements SignalsMiddleware {
  process(signal: Signal) {
    if (
      signal.type === 'network' &&
      signal.data.action === 'request' &&
      ...
    ) {
      // drop or modify signal
      return null
    } else {
      return signal
    }
  }
}
const signalsPlugin = new SignalsPlugin({
  middleware: [new MyMiddleware()]
})
```
