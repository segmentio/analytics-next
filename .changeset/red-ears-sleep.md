---
'@segment/analytics-next': patch
---

Fixes a bug where users who override page properties:
```ts
analytics.page(undefined, undefined, {search: "?utm_source=123&utm_content=content" )
analytics.track("foo", {url: "....", search: "?utm_source=123&utm_content=content" )
```
...would get the wrong context.campaign object.
