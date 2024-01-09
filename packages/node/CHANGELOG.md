# @segment/analytics-node

## 1.2.0

### Minor Changes

- [#1015](https://github.com/segmentio/analytics-next/pull/1015) [`8fbe1a0`](https://github.com/segmentio/analytics-next/commit/8fbe1a0d4cecff850c28b7da57f903c6df285231) Thanks [@silesky](https://github.com/silesky)! - Deprecate `maxEventsInBatch` in favor of our commonly used: `flushAt`. The purpose is to establish consistency between our SDKs, regardless of language.

### Patch Changes

- Updated dependencies [[`7b93e7b`](https://github.com/segmentio/analytics-next/commit/7b93e7b50fa293aebaf6767a44bf7708b231d5cd)]:
  - @segment/analytics-generic-utils@1.1.1
  - @segment/analytics-core@1.4.1

## 1.1.4

### Patch Changes

- Updated dependencies [[`d9b47c4`](https://github.com/segmentio/analytics-next/commit/d9b47c43e5e08efce14fe4150536ff60b8df91e0), [`d9b47c4`](https://github.com/segmentio/analytics-next/commit/d9b47c43e5e08efce14fe4150536ff60b8df91e0)]:
  - @segment/analytics-core@1.4.0
  - @segment/analytics-generic-utils@1.1.0

## 1.1.3

### Patch Changes

- [#974](https://github.com/segmentio/analytics-next/pull/974) [`c879377`](https://github.com/segmentio/analytics-next/commit/c87937720941ad830c5fdd76b0c049435a6ddec6) Thanks [@silesky](https://github.com/silesky)! - Refactor to get createDeferred from @segment/analytics-generic-utils lib

- Updated dependencies [[`c879377`](https://github.com/segmentio/analytics-next/commit/c87937720941ad830c5fdd76b0c049435a6ddec6)]:
  - @segment/analytics-generic-utils@1.0.0

## 1.1.2

### Patch Changes

- Updated dependencies [[`897f4cc`](https://github.com/segmentio/analytics-next/commit/897f4cc69de4cdd38efd0cd70567bfed0c454fec)]:
  - @segment/analytics-core@1.3.2

## 1.1.1

### Patch Changes

- [#946](https://github.com/segmentio/analytics-next/pull/946) [`edfb8b5`](https://github.com/segmentio/analytics-next/commit/edfb8b5c4463c2ccd336fdfc7c35d4cd711f5410) Thanks [@danieljackins](https://github.com/danieljackins)! - Include sentAt field in payload

- Updated dependencies [[`ee855ba`](https://github.com/segmentio/analytics-next/commit/ee855bad751c393a40dcbde7ae861f27d2b4da26)]:
  - @segment/analytics-core@1.3.1

## 1.1.0

### Minor Changes

- [#880](https://github.com/segmentio/analytics-next/pull/880) [`5f50363`](https://github.com/segmentio/analytics-next/commit/5f5036332a3b21d5eb5324c2ed332190b42b2318) Thanks [@silesky](https://github.com/silesky)! - Add `httpClient` setting. This allow users to override default HTTP client with a custom one.

## 1.0.0

### Patch Changes

- [#855](https://github.com/segmentio/analytics-next/pull/855) [`ee409a7`](https://github.com/segmentio/analytics-next/commit/ee409a7f36d82af359b3dc32d5ccc6a436cf8b6d) Thanks [@silesky](https://github.com/silesky)! - GA Release
