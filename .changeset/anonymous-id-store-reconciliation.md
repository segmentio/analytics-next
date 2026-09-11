---
"@segment/analytics-next": patch
---

Added an opt-in `resolveAnonymousIdConflicts` option (`user: { resolveAnonymousIdConflicts: true }` in load options), off by default, that fixes `anonymousId` diverging between subdomains of the same site (see #706).

`localStorage` is per-origin, but sits ahead of the shared, cross-subdomain cookie in the default store priority. Once the two disagree -- e.g. a per-origin `localStorage` entry drifts from the shared cookie -- whichever store sits first in priority order wins permanently, with no way for the two to resync. With this option enabled, the cookie's value wins a disagreement instead, and every store is resynced to it.

This ships off by default: with it disabled (the default), behavior is unchanged. Enabling it only changes behavior in the already-broken case where stores disagree; when they already agree, it returns the exact same value as before.
