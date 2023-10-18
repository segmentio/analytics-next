# Integration Tests for @segment/analytics-node

## Tests

| Test Path                                        | Description                                                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [./src/durability-tests](src/durability-tests/)  | Test that all the events created by the Analytics SDK end up as HTTP Requests, and that graceful shutdown does not result in events getting lost. |
| [./src/perf-tests](src/perf-tests/)              | These tests confirm that performance has not regresssed relative to the old SDK or from the baseline (which a handler _without_ analytics).       |
| [./src/cloudflare-tests/](src/cloudflare-tests/) | These tests confirm that the SDK runs as expected in cloudflare workers.                                                                          |

Build deps and run tests:

```sh
yarn turbo run --filter=node-integration-tests test # from repo root
```
