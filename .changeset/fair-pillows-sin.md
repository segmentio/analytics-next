---
'@segment/analytics-consent-tools': major
---

* Rename `shouldLoad` -> `shouldLoadSegment`
* Remove redundant `shouldDisableConsentRequirement` setting, in favor of shouldLoad's `ctx.abort({  disableConsentRequirement: true/false })`
* Create `shouldLoadWrapper` API for waiting for consent script initialization.
