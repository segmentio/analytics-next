---
'@segment/analytics-consent-tools': major
---

* Rename `shouldLoad` -> `shouldLoadSegment`
* Rename `ctx.abort({ loadSegmentNormally -> disableConsentRequirement` to be more consistent with the setting that shares that name.
* Create `shouldLoadWrapper` API for waiting for consent script initialization.
