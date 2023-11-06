---
'@segment/analytics-consent-tools': minor
---
Segment will not load, or, if already loaded, will not send events to segment, if all of the following conditions are met:
1. No destinations without a consent mapping (consentSettings.hasUnmappedDestinations == false)

    AND

2. User has not consented to any category present in the consentSettings.allCategories array.
