---
'@segment/analytics-next': minor
---

- Capture page context information faster, so context.campaign and context.page are more resilient to quick navigation changes.
- Parse UTM params into context.campaign if users pass an object to a page call.
- Export `getDefaultPageContext` for node users who need help constructing page.
