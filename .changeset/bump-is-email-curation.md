---
"@segment/analytics-next": patch
---

Bump the transitive `is-email` dependency (pulled in via `@segment/facade`) from 0.1.1 to 1.0.2.

This was forced because 0.1.1 (and every other 0.x release) is blocked by our npm registry's curation policy, which would otherwise prevent any release from installing.

**Behavior change:** `@segment/facade`'s internal email-format detection (used when processing `identify`/`track`/`page`/`group` calls) becomes stricter as a result. `is-email@0.1.1` used a very loose pattern (`/.+@.+\..+/`, matching almost anything shaped like `x@y.z`); `is-email@1.0.2` uses a proper RFC-5321-style pattern and caps input at 320 characters. In the rare case where a trait value was being loosely classified as an email-shaped string before, it may no longer be after this change (or vice versa, in edge cases the old pattern rejected that the stricter one accepts, like values containing `+`, `.`, or other pattern-valid characters outside the old pattern's assumptions). If you depend on this classification (directly or indirectly), verify your integration continues to see the values you expect.
