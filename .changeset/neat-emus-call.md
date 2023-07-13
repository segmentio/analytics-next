---
'@segment/analytics-next': patch
---

Fix query string parsing bug that was causing events containing the 'search' property with a non string value to be dropped
