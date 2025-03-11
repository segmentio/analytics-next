---
'@segment/analytics-next': minor
'@segment/analytics-signals': patch
---

Fix argument resolver bug where the following would not set the correct options:
```ts
analytics.page(
   null, 
   'foo', 
   { url: "https://foo.com" }, 
   { context: { __eventOrigin: { type: 'Signal' } } // would not be set correctly
)
```
