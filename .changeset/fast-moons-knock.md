---
'@segment/analytics-next': minor
'@segment/analytics-core': minor
---

Addresses an issue where, if one of the non-destination actions fails to load/is blocked, the entire SDK fails to load. This is most notable in GA4, where, if GA was blocked, Segment initialization would fail.

In doing so, introduces a critical: true API.