---
'@segment/analytics-next': minor
---

Fixes #1336 NullAnalytics was accidentally removed from the public exports in commit b611746 (PR #1090) when exports were changed from wildcard to explicit. This restores the export for users who need NullAnalytics in their test code.
