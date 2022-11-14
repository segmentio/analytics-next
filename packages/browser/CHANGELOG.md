# @segment/analytics-next

## 1.46.1

### Patch Changes

- Updated dependencies [[`98d1b12`](https://github.com/segmentio/analytics-next/commit/98d1b127082f5fc7904980a561220c64c26edff3)]:
  - @segment/analytics-core@1.1.2

## 1.46.0

### Minor Changes

- [#655](https://github.com/segmentio/analytics-next/pull/655) [`5e3f077`](https://github.com/segmentio/analytics-next/commit/5e3f077b93083ca6a3a7ad0fcd56f5fc87f6af8e) Thanks [@silesky](https://github.com/silesky)! - Fix analytics reset clears anonymous ID bug

- [#637](https://github.com/segmentio/analytics-next/pull/637) [`b335096`](https://github.com/segmentio/analytics-next/commit/b3350968a5437f5c824315aaa15602d648c1ac4e) Thanks [@silesky](https://github.com/silesky)! - Add ability to delay initialization

* [#635](https://github.com/segmentio/analytics-next/pull/635) [`222d4ec`](https://github.com/segmentio/analytics-next/commit/222d4ecd4db7376839aa816b4b8923cae4f1487c) Thanks [@chrisradek](https://github.com/chrisradek)! - Adds a new load option `disableAutoISOConversions` that turns off converting ISO strings in event fields to Dates for integrations.

### Patch Changes

- [#641](https://github.com/segmentio/analytics-next/pull/641) [`3d31bd0`](https://github.com/segmentio/analytics-next/commit/3d31bd09ea2029a9e5413aebe55698bbf4fbf7c9) Thanks [@silesky](https://github.com/silesky)! - Update tsub dependency

- Updated dependencies [[`409cae4`](https://github.com/segmentio/analytics-next/commit/409cae4b9ac404277aa44bab7428186129b42a35)]:
  - @segment/analytics-core@1.1.1

## 1.45.0

### Minor Changes

- [#616](https://github.com/segmentio/analytics-next/pull/616) [`1d6c22d`](https://github.com/segmentio/analytics-next/commit/1d6c22d7565b59ae553de674276ecd0c9aeddfbe) Thanks [@zikaari](https://github.com/zikaari)! - Bundled analytics support in Inspector

### Patch Changes

- [#619](https://github.com/segmentio/analytics-next/pull/619) [`6c35799`](https://github.com/segmentio/analytics-next/commit/6c3579999d8696b3ebd0ff5c52493a73ca11cdec) Thanks [@silesky](https://github.com/silesky)! - Do not expose jquery / zepto as ambient globals. Add dom.iterable lib to typescript.

* [#629](https://github.com/segmentio/analytics-next/pull/629) [`21f05ad`](https://github.com/segmentio/analytics-next/commit/21f05adfd641825abecd096b354bd1ebc17f063b) Thanks [@danieljackins](https://github.com/danieljackins)! - Fix bug where destination middleware were applying to other plugin types

## 1.44.0

### Minor Changes

- [#597](https://github.com/segmentio/analytics-next/pull/597) [`18dc5b0`](https://github.com/segmentio/analytics-next/commit/18dc5b07431276a9b2ff3bdff28da0f3ee1e4fa8) Thanks [@danieljackins](https://github.com/danieljackins)! - Added destination filter support to action destinations

## 1.43.2

### Patch Changes

- [#621](https://github.com/segmentio/analytics-next/pull/621) [`5026ee1`](https://github.com/segmentio/analytics-next/commit/5026ee1e69a16e4597bd9c95d57158f831e9b983) Thanks [@silesky](https://github.com/silesky)! - Fix ambient import conflict bug

## 1.43.1

### Patch Changes

- [#615](https://github.com/segmentio/analytics-next/pull/615) [`6d51d38`](https://github.com/segmentio/analytics-next/commit/6d51d3839d7df8b5241b824fe9c0761d4c18dcf2) Thanks [@silesky](https://github.com/silesky)! - Add the load function type to AnalyticsSnippet

* [#611](https://github.com/segmentio/analytics-next/pull/611) [`29c3bd7`](https://github.com/segmentio/analytics-next/commit/29c3bd7602bed1871b1a0048531ddffd47ce5710) Thanks [@chrisradek](https://github.com/chrisradek)! - Fixes analytics.reset() so that it clears group data.

- [#613](https://github.com/segmentio/analytics-next/pull/613) [`503bea2`](https://github.com/segmentio/analytics-next/commit/503bea221643dbd317376c28c7ce60c688329756) Thanks [@silesky](https://github.com/silesky)! - fix change detection bug and add ability to detect tab focus loss events

- Updated dependencies [[`4644afc`](https://github.com/segmentio/analytics-next/commit/4644afc5be2dac90465e16a485ef5c34ff694da3), [`598fc31`](https://github.com/segmentio/analytics-next/commit/598fc318a457ac6e5b04d04406f8d836d83763a4), [`ce90543`](https://github.com/segmentio/analytics-next/commit/ce905439355c1cbd306535600bf356710be147de), [`7b5d3df`](https://github.com/segmentio/analytics-next/commit/7b5d3df8d7d8e479d1dda4557297baedb3cdcf6f)]:
  - @segment/analytics-core@1.1.0

## 1.43.0

### Minor Changes

- [#573](https://github.com/segmentio/analytics-next/pull/573) [`6203c20`](https://github.com/segmentio/analytics-next/commit/6203c20cd0673f55a29c546440e0c02f6998df5a) Thanks [@arielsilvestri](https://github.com/arielsilvestri)! - Enhances console error logging when requests to settings api fail

### Patch Changes

- [#582](https://github.com/segmentio/analytics-next/pull/582) [`ebafece`](https://github.com/segmentio/analytics-next/commit/ebafeceb5e3b2c6cfe3d29313a443615093170a2) Thanks [@chrisradek](https://github.com/chrisradek)! - Updates error message when sending metrics fails to indicate that metrics failed to send.

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
