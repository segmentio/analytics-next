---
'@segment/analytics-node': patch
---

Fix closeAndFlush silently dropping in-flight events on timeout.

- Cancel pending retry sleeps via AbortController when closeAndFlush times out, instead of silently swallowing the timeout error.
- Raise default closeAndFlush timeout floor to 75s (was 12.5s) so it survives at least one Retry-After: 60 cycle.
- Add `http_response` emitter event for observing API response status codes and headers.
