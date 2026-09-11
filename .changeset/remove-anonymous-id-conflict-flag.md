---
"@segment/analytics-next": patch
---

Removed the `resolveAnonymousIdConflicts` option, added in the previous release, and made its behavior the unconditional default: when the cookie and localStorage disagree on `anonymousId`, the cookie always wins and every store is resynced to it, instead of localStorage's value winning permanently (see #706).

**Behavior change:** this is no longer opt-in. It only changes behavior for sources where the cookie and localStorage already disagree -- when they agree (the common case), the result is unchanged. If any customer explicitly set `resolveAnonymousIdConflicts: false` in their load options, that field is now ignored (harmless); the option was only in the previous release, so no meaningful adoption window existed for anyone relying on its absence.
