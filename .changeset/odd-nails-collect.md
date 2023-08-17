---
'@segment/analytics-next': patch
---

`sentAt` is not set at batch upload time once per the whole batch. Individual event `sentAt` property is stripped when doing batch uploading.
