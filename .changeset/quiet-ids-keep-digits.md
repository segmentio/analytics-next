---
"@segment/analytics-next": patch
---

Fix numeric-looking string values (e.g. an `anonymousId` of `"7689174720735493772"`, as set via `?ajs_aid=`) being rounded when read back from the cookie. The cookie and localStorage stores now only return a number if it prints back to exactly the stored text; otherwise the original string is returned. Numbers that round-trip exactly (e.g. `12345`) are still returned as numbers, so AJS 1.0 numeric ids continue to be coerced to strings as before.
