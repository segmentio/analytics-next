---
'@segment/analytics-next': minor
---

Add a `nonce` init option that is applied to scripts injected at runtime (device-mode destinations, action destinations, remote middleware and webpack lazy chunks), e.g. `analytics.load(settings, { nonce })`.
