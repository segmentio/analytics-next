---
'@segment/analytics-core': patch
---

Fixes an issue introduced in v1.66.0 that caused analytics plugins to be removed from event processing if a destination threw an error while loading.
