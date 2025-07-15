---
'@segment/analytics-next': minor
---

Initialize should actually support getting the initialized analytics instance.

```ts
analytics.on('initialize',function ({ analytics }) {
  console.log('initialize', analytics.user()) // this works now.
})
