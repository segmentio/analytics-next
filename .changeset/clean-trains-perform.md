---
'@segment/analytics-next': minor
---
- Remove validation plugin
- Remove `spark-md5` dependency
- Update messageId algorithm to be consistent with node (analytics-next-[epoch time]-[uuid])
- Browser Validation:
  - Throws errors in the EventFactory (not just in a plugin) if the event is invalid
