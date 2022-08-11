# @segment/analytics-next

## 1.42.3

### Patch Changes

- [#577](https://github.com/segmentio/analytics-next/pull/577) [`8d48bdc`](https://github.com/segmentio/analytics-next/commit/8d48bdc106a15d6368de215e11712470596e1df7) Thanks [@chrisradek](https://github.com/chrisradek)! - Fixes an issue where the 'secure' cookie setting was not being applied correctly when specified.

* [#579](https://github.com/segmentio/analytics-next/pull/579) [`98504e2`](https://github.com/segmentio/analytics-next/commit/98504e2f5514030d782e06df0562ea25f4f01c34) Thanks [@silesky](https://github.com/silesky)! - Fix SegmentEvent and EventProperties and add tests

## 1.42.2

### Patch Changes

- [#578](https://github.com/segmentio/analytics-next/pull/578) [`ab8cea3`](https://github.com/segmentio/analytics-next/commit/ab8cea3a210a161fcb7c27e07d41edcb78fa4c3f) Thanks [@silesky](https://github.com/silesky)! - Loosen SegmentEvent and Traits typescript interface (Fixes [#570](https://github.com/segmentio/analytics-next/issues/570), [#575](https://github.com/segmentio/analytics-next/issues/575)).

## 1.42.1

### Patch Changes

- [#567](https://github.com/segmentio/analytics-next/pull/567) [`5cd9358`](https://github.com/segmentio/analytics-next/commit/5cd9358d0a8ae9711eea22ae719e9f7363581798) Thanks [@silesky](https://github.com/silesky)! - Do not allow the "user" method to change its return types over its lifecycle. We should always return a promise for wrapped methods in AnalyticsBrowser, regardless if the underlying Analytics method is sync or async.

## 1.42.0

### Minor Changes

- [#561](https://github.com/segmentio/analytics-next/pull/561) [`1af2a9f`](https://github.com/segmentio/analytics-next/commit/1af2a9fa13596464d152bcecac19df110cd074bc) Thanks [@silesky](https://github.com/silesky)! - Add 'screen', 'register', 'deregister', 'user' method and 'VERSION' property on AnalyticsBrowser. Allow buffering of 'screen', 'register', 'deregister' methods for snippet users.

### Patch Changes

- Updated dependencies [[`93c8f1f`](https://github.com/segmentio/analytics-next/commit/93c8f1f7dabe6fca5bd0f8f9f0cc0c0e14cd2128)]:
  - @segment/analytics-core@1.0.1

## 1.41.1

### Patch Changes

- [#552](https://github.com/segmentio/analytics-next/pull/552) [`6741775`](https://github.com/segmentio/analytics-next/commit/6741775be068e08eccd84024211b89181094d5b7) Thanks [@zikaari](https://github.com/zikaari)! - Suspend event deliveries until middlewares are ready

## 1.41.0

### Minor Changes

- [#541](https://github.com/segmentio/analytics-next/pull/541) [`2e0a91c`](https://github.com/segmentio/analytics-next/commit/2e0a91c6989aa87f09c9590c5017806023664119) Thanks [@silesky](https://github.com/silesky)! - Export AnalyticsSnippet type and add directions (for snippet users).

### Patch Changes

- [#549](https://github.com/segmentio/analytics-next/pull/549) [`3413701`](https://github.com/segmentio/analytics-next/commit/34137016239e90deb8ba790a44664534aa7614b9) Thanks [@zikaari](https://github.com/zikaari)! - Simplify interfacing with Inspector

## 1.40.0

### Minor Changes

- [#413](https://github.com/segmentio/analytics-next/pull/413) [`44cc464`](https://github.com/segmentio/analytics-next/commit/44cc464eea0c2ca9ea66bd9221a5ba86c1fcd86e) Thanks [@zikaari](https://github.com/zikaari)! - Add support for Segment Inspector Chrome extension

* [#505](https://github.com/segmentio/analytics-next/pull/505) [`b9c6356`](https://github.com/segmentio/analytics-next/commit/b9c6356b7d35ee8acb6ecbd1eebc468d18d63958) Thanks [@chrisradek](https://github.com/chrisradek)! - Adds `context.failedDelivery()` to improve detection of events that could not be delivered due to plugin errors.

### Patch Changes

- [#526](https://github.com/segmentio/analytics-next/pull/526) [`908f47d`](https://github.com/segmentio/analytics-next/commit/908f47d187c8dd45c4cff79c0f06800173ab7cb0) Thanks [@silesky](https://github.com/silesky)! - Updated dev instructions in README

## 1.39.2

### Patch Changes

- [#513](https://github.com/segmentio/analytics-next/pull/513) [`1d36ca1`](https://github.com/segmentio/analytics-next/commit/1d36ca1440fc5df9171d16278d8918b3e5a32128) Thanks [@silesky](https://github.com/silesky)! - test
