---
'@segment/analytics-consent-onetrust': patch
---

#987

Fix bug: if showAlertNotice is false and Segment has default categories, we want to immediately load Segment with any default categories.
This PR mantains the status quo when it comes to end user re-consent / updated consent (consent updates made after the initial consent decision, in this case, any decision where the end user toggles the alert box on again.)
* stamped consent categories will update as usual
* analytics will not load any new device mode plugins according to the updated consent
