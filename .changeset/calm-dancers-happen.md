---
'@segment/analytics-consent-tools': minor
---
analytics will not initialize if all of the following conditions are met:
1. No destinations without a consent mapping (consentSettings.hasUnmappedDestinations == false)

    AND

2. User has not consented to any category present in the consentSettings.allCategories array.
