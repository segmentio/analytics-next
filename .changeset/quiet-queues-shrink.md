---
"@segment/analytics-next": patch
---

Cap the persisted event queue at 500 items per queue (dropping the oldest) and prune its `seen` entries, so queues for destinations that never load (e.g. blocked by an ad blocker) no longer grow until they exhaust the localStorage quota.
