---
'@segment/analytics-next': minor
---

Fix stale page context information for buffered events, so page data is resilient to quick navigation changes. Parse UTM params into context.campaign if users pass an object to a page call.
