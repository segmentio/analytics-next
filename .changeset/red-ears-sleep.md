---
'@segment/analytics-next': patch
---

Fixes a utm-parameter parsing bug where overridden page.search properties would not be reflected in the context.campaign object
```ts
analytics.page(undefined, undefined, {search: "?utm_source=123&utm_content=content" )
analytics.track("foo", {url: "....", search: "?utm_source=123&utm_content=content" )

// should result in a context.campaign of:
{ source: 123, content: 'content'}
```
