---
"@segment/analytics-next": patch
---

Fix a couple of contributing causes of `anonymousId` (and `userId`) cookies intermittently reverting to a host-only scope instead of the shared, cross-subdomain domain -- part of the same underlying issue as #706.

- `tld()` now memoizes the resolved top-level domain per hostname instead of re-probing cookies (a live set/get/remove round-trip) on every single `CookieStorage` instantiation. Multiple stores were being constructed per page load, so a single transient probe failure could leave some of them silently downgraded to a host-only cookie while others kept the shared, cross-subdomain one.
- `tld()` now logs a `console.warn` when it falls back to a host-only cookie because the probe failed (as opposed to the expected `undefined` for `localhost`/IP hosts), instead of failing silently.
- `CookieStorage.remove()` (and `.set(key, null)`) now also clears a possible host-only duplicate of the cookie, in addition to the one at the configured `domain`. Previously, a stray host-scoped cookie left behind by a past `tld()` failure could never be cleaned up, not even by `reset()`.

No behavior changes here -- these only do anything in a scenario that was already broken.
