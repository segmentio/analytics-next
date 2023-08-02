---
'@segment/analytics-consent-wrapper-onetrust': patch
---

Require category IDs for OneTrust mapping (e.g CAT0002, SEG0003), and do not accept category name any more. Reason: documentation is easier, and Segment currently has a 20 char limit on category IDs.
