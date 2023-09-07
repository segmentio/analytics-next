# @segment/analytics-consent-wrapper-onetrust

## 0.3.0

### Minor Changes

- [#941](https://github.com/segmentio/analytics-next/pull/941) [`d8c5ad9`](https://github.com/segmentio/analytics-next/commit/d8c5ad9dff06e42656504657fdd27e6a67b875e3) Thanks [@silesky](https://github.com/silesky)! - Tighten up analytics types

### Patch Changes

- [#941](https://github.com/segmentio/analytics-next/pull/941) [`d8c5ad9`](https://github.com/segmentio/analytics-next/commit/d8c5ad9dff06e42656504657fdd27e6a67b875e3) Thanks [@silesky](https://github.com/silesky)! - - Fix `onConsentChanged` not firing in snippet environment due to to stale analytics reference.
  - Register `onConsentChanged` early in the wrapper initialization sequence so it can catch consent changed events that occur before analytics is loaded.
- Updated dependencies [[`d8c5ad9`](https://github.com/segmentio/analytics-next/commit/d8c5ad9dff06e42656504657fdd27e6a67b875e3), [`d8c5ad9`](https://github.com/segmentio/analytics-next/commit/d8c5ad9dff06e42656504657fdd27e6a67b875e3)]:
  - @segment/analytics-consent-tools@0.2.0

## 0.2.0

### Minor Changes

- [#938](https://github.com/segmentio/analytics-next/pull/938) [`2191eb3`](https://github.com/segmentio/analytics-next/commit/2191eb34b501c21f963f0e39426f89b5e6baed39) Thanks [@silesky](https://github.com/silesky)! - - Change API from oneTrust(analytics) -> withOneTrust(analytics). Allow withOneTrust(analytics).load(...).
  - Add a umd bundle for snippet users

### Patch Changes

- Updated dependencies [[`2191eb3`](https://github.com/segmentio/analytics-next/commit/2191eb34b501c21f963f0e39426f89b5e6baed39)]:
  - @segment/analytics-consent-tools@0.1.1

## 0.1.0

### Minor Changes

- [#936](https://github.com/segmentio/analytics-next/pull/936) [`a7a0882`](https://github.com/segmentio/analytics-next/commit/a7a08827cc31dd3a558700143828ab43d27f2125) Thanks [@silesky](https://github.com/silesky)! - Add consent changed event

### Patch Changes

- Updated dependencies [[`a7a0882`](https://github.com/segmentio/analytics-next/commit/a7a08827cc31dd3a558700143828ab43d27f2125)]:
  - @segment/analytics-consent-tools@0.1.0

## 0.0.4

### Patch Changes

- [#919](https://github.com/segmentio/analytics-next/pull/919) [`e3e3971`](https://github.com/segmentio/analytics-next/commit/e3e3971c7e12ca6bc41586531b5468aa3640d922) Thanks [@silesky](https://github.com/silesky)! - Require category IDs for OneTrust mapping (e.g CAT0002, SEG0003), and do not accept category name any more. Reason: documentation is easier, and Segment currently has a 20 char limit on category IDs.

- Updated dependencies [[`70cc6e6`](https://github.com/segmentio/analytics-next/commit/70cc6e61a809bd44a9e34555b64da9a3b8672fdf), [`fd0862c`](https://github.com/segmentio/analytics-next/commit/fd0862c544d4418719863e8f5418b5ab61a9ca5e)]:
  - @segment/analytics-consent-tools@0.0.4

## 0.0.3

### Patch Changes

- [#895](https://github.com/segmentio/analytics-next/pull/895) [`aa56556`](https://github.com/segmentio/analytics-next/commit/aa5655659760c53183df22b6b001e0a204feffde) Thanks [@silesky](https://github.com/silesky)! - Remove strictly neccessary cookie logic

- Updated dependencies [[`d9e135a`](https://github.com/segmentio/analytics-next/commit/d9e135a7174ce0a4d90fe1339c4833bd86b8f429), [`6789f9b`](https://github.com/segmentio/analytics-next/commit/6789f9b213f63698da8ca67d6631966aefc58345)]:
  - @segment/analytics-consent-tools@0.0.3

## 0.0.2

### Patch Changes

- [#892](https://github.com/segmentio/analytics-next/pull/892) [`1d08764`](https://github.com/segmentio/analytics-next/commit/1d087647fd359b6332d597ae5b640decb3e86670) Thanks [@silesky](https://github.com/silesky)! - Make package work with next 12 and next 13 without transpiling.

- Updated dependencies [[`1d08764`](https://github.com/segmentio/analytics-next/commit/1d087647fd359b6332d597ae5b640decb3e86670)]:
  - @segment/analytics-consent-tools@0.0.2

## 0.0.1

### Patch Changes

- [`2c3c391`](https://github.com/segmentio/analytics-next/commit/2c3c391c61f859295faa9c9fff102f493f902186) Thanks [@silesky](https://github.com/silesky)! - Release onetrust

- Updated dependencies [[`1e2d003`](https://github.com/segmentio/analytics-next/commit/1e2d003e28bc35266b8de925d67a09376cab255d)]:
  - @segment/analytics-consent-tools@0.0.1
