---
'@segment/analytics-next': patch
---

Do not allow the "user" method to change its return types over its lifecycle. We should always return a promise for wrapped methods in AnalyticsBrowser, regardless if the underlying Analytics method is sync or async.