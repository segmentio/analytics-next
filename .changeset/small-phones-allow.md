---
'@segment/analytics-next': minor
---

Allow `*` in integration name field to apply middleware to all destinations plugins.
```ts
addDestinationMiddleware('*', ({ ... }) => {
 ...
})
```
