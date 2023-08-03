---
'@segment/analytics-consent-tools': patch
---

Remove default behavior that prunes unmapped categories from context.contest payload. As such, by default, `allKeys` will no longer be used. Add ability to turn pruning back on via an `pruneUnmappedCategories` setting.
