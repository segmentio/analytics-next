---
'@segment/analytics-next': minor
---
- Remove validation plugin
- Update messageId algorithm to be consistent with node (analytics-next-[epoch time]-[uuid])
- Share `EventFactory` between node and browser.
- Browser Validation:
  - Throws an error in the EventFactory (not just in a plugin) if the event is invalid
  - Validates that one of userId/anonId/groupId/previousId is available and throws an error (consistency with the node validation). 