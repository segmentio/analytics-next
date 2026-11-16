---
"@segment/analytics-next": patch
---

Fix uncaught `QuotaExceededError` when the persisted event queue writes to localStorage. Write failures are now caught and logged, and the queue lock is always released.
