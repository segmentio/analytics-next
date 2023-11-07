---
'@segment/analytics-consent-wrapper-onetrust': patch
---

#987

Fix bug: if showAlertNotice is false and Segment has default categories, we want to immediately load Segment with any default categories.

