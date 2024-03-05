# @segment/analytics-node

## 2.1.0

### Minor Changes

- [#1043](https://github.com/segmentio/analytics-next/pull/1043) [`95fd2fd`](https://github.com/segmentio/analytics-next/commit/95fd2fd801da26505ddcead96ffaa83aa4364994) Thanks [@silesky](https://github.com/silesky)! - This ensures backward compatibility with analytics-node by modifying '@segment/analytics-core'. Specifically, the changes prevent the generation of a messageId if it is already set. This adjustment aligns with the behavior outlined in analytics-node's source code [here](https://github.com/segmentio/analytics-node/blob/master/index.js#L195-L201).

  While this is a core release, only the node library is affected, as the browser has its own EventFactory atm.

### Patch Changes

- Updated dependencies [[`95fd2fd`](https://github.com/segmentio/analytics-next/commit/95fd2fd801da26505ddcead96ffaa83aa4364994), [`d212633`](https://github.com/segmentio/analytics-next/commit/d21263369d5980f4f57b13795524dbc345a02e5c)]:
  - @segment/analytics-core@1.5.0
  - @segment/analytics-generic-utils@1.2.0

## 2.0.0

### Major Changes

- [#935](https://github.com/segmentio/analytics-next/pull/935) [`833ade8`](https://github.com/segmentio/analytics-next/commit/833ade8571319a029f8e23511967ccb02d3496d4) Thanks [@MichaelGHSeg](https://github.com/MichaelGHSeg)! - Removing support for Node.js 14 and 16 as they are EOL

* [#935](https://github.com/segmentio/analytics-next/pull/935) [`833ade8`](https://github.com/segmentio/analytics-next/commit/833ade8571319a029f8e23511967ccb02d3496d4) Thanks [@MichaelGHSeg](https://github.com/MichaelGHSeg)! - Support for Segment OAuth2

  OAuth2 must be enabled from the Segment dashboard. You will need a PEM format
  private/public key pair. Once you've uploaded your public key, you will need
  the OAuth Client Id, the Key Id, and your private key. You can set these in
  the new OAuthSettings type and provide it in your Analytics configuration.

  Note: This introduces a breaking change only if you have implemented a custom
  HTTPClient. HTTPClientRequest `data: Record<string, any>` has changed to
  `body: string`. Processing data into a string now occurs before calls to
  `makeRequest`

## 1.3.0

### Minor Changes

- [#1010](https://github.com/segmentio/analytics-next/pull/1010) [`5f37f4f`](https://github.com/segmentio/analytics-next/commit/5f37f4f6ea15b2457e6edf11cc92ddbf0dd11736) Thanks [@silesky](https://github.com/silesky)! - Add analytics.flush({ timeout: ..., close: ... }) method

* [#1008](https://github.com/segmentio/analytics-next/pull/1008) [`e57960e`](https://github.com/segmentio/analytics-next/commit/e57960e84f5ce5b214dde09928bee6e6bdba3a69) Thanks [@danieljackins](https://github.com/danieljackins)! - Change segmentio to destination type

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
