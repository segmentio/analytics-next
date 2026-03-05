---
'@segment/analytics-next': minor
'@segment/analytics-node': minor
'@segment/analytics-core': patch
---

Unify and harden HTTP response handling and retry behavior across browser and node SDKs.

- Browser (`@segment/analytics-next`)
	- Add config-driven response handling for Segment.io delivery (`httpConfig` with rate-limit/backoff controls).
	- Improve batching/dispatcher retry semantics for 429 and transient failures.
	- Use configured `protocol` for batching requests when `apiHost` has no scheme, while preserving compatibility for `apiHost` values that already include `http://` or `https://`.

- Node (`@segment/analytics-node`)
	- Align publisher retry/status behavior with updated response handling rules.
	- Add `maxTotalBackoffDuration` and `maxRateLimitDuration` settings to control retry ceilings.
	- Update default retry configuration to increase resilience under transient failures.

- Core (`@segment/analytics-core`)
	- Standardize backoff defaults used by retry queues.
