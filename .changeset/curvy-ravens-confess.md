---
'@segment/analytics-consent-tools': minor
'@segment/analytics-consent-wrapper-onetrust': minor
---

- Fix `onConsentChanged` not firing in snippet environment due to to stale analytics reference.
- Register `onConsentChanged` early in the wrapper initialization sequence so it can catch consent changed events that occur before analytics is loaded.
