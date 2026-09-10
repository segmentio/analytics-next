---
"@segment/analytics-next": patch
---

**Behavior change:** added `UniversalStorage#getConsistent`, now used for reading/writing `anonymousId`. If the underlying stores disagree on the value (e.g. a per-origin `localStorage` entry has drifted from the shared, cross-subdomain cookie -- see #706), the cookie's value now wins and every store is resynced to it, rather than whichever store happens to sit first in priority order winning permanently with no way to resync.

When all stores already agree (the common case), this returns the exact same value as before -- this only changes behavior in the already-broken case where stores disagree. If you have custom `storage.stores` configuration that intentionally keeps `localStorage` and cookies out of sync across origins, this removes that ability for `anonymousId` specifically.
