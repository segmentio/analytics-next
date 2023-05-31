---
'@segment/analytics-next': patch
---

Fixes issue related to how retried events are stored in localStorage to prevent analytics.js from reading events for a different writeKey when that writeKey is used on the same domain as the current analytics.js.
