---
'@segment/analytics-consent-tools': major
---

* Rename `shouldLoad` -> `shouldLoadSegment`
* Remove redundant `shouldDisableConsentRequirement` setting, in favor of shouldLoad's `ctx.abort({loadSegmentNormally: true})`
* Create `shouldLoadWrapper` API for waiting for consent script initialization.
