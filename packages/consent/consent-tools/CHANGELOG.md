# @segment/analytics-consent-tools

## 1.2.0

### Minor Changes

- [#1009](https://github.com/segmentio/analytics-next/pull/1009) [`f476038`](https://github.com/segmentio/analytics-next/commit/f47603881b787cc81fa1da4496bdbde9eb325a0f) Thanks [@silesky](https://github.com/silesky)! - If initialPageview is true, call analytics.page() as early as possible to avoid stale page context.

### Patch Changes

- [#1020](https://github.com/segmentio/analytics-next/pull/1020) [`7b93e7b`](https://github.com/segmentio/analytics-next/commit/7b93e7b50fa293aebaf6767a44bf7708b231d5cd) Thanks [@silesky](https://github.com/silesky)! - Add tslib to resolve unsound dependency warning.

## 1.1.0

### Minor Changes

- [#1001](https://github.com/segmentio/analytics-next/pull/1001) [`57be1ac`](https://github.com/segmentio/analytics-next/commit/57be1acd556a9779edbc5fd4d3f820fb50b65697) Thanks [@silesky](https://github.com/silesky)! - analytics will not initialize if all of the following conditions are met:

  1. No destinations without a consent mapping (consentSettings.hasUnmappedDestinations == false)

     AND

  2. User has not consented to any category present in the consentSettings.allCategories array.

### Patch Changes

- [#997](https://github.com/segmentio/analytics-next/pull/997) [`dcf279c`](https://github.com/segmentio/analytics-next/commit/dcf279c4591c84952c78022ddfbad945aab8cfde) Thanks [@silesky](https://github.com/silesky)! - Refactor internally to add AnalyticsService

## 1.0.0

### Major Changes

- [#983](https://github.com/segmentio/analytics-next/pull/983) [`930af49`](https://github.com/segmentio/analytics-next/commit/930af49b27f7c2973304c7ae76b67d264223e6f6) Thanks [@silesky](https://github.com/silesky)! - \* Rename `shouldLoad` -> `shouldLoadSegment`
  - Remove redundant `shouldDisableConsentRequirement` setting, in favor of shouldLoad's `ctx.abort({loadSegmentNormally: true})`
  - Create `shouldLoadWrapper` API for waiting for consent script initialization.

### Patch Changes

- [#990](https://github.com/segmentio/analytics-next/pull/990) [`a361575`](https://github.com/segmentio/analytics-next/commit/a361575152f8313dfded3b0cc4b9912b4e2a41c3) Thanks [@silesky](https://github.com/silesky)! - Refactor consent wrapper; export GetCategoriesFunction

* [#991](https://github.com/segmentio/analytics-next/pull/991) [`008a019`](https://github.com/segmentio/analytics-next/commit/008a01927973340bd93cd0097e45c455d49baea5) Thanks [@silesky](https://github.com/silesky)! - Import from local utils rather than lodash

## 0.2.1

### Patch Changes

- [#959](https://github.com/segmentio/analytics-next/pull/959) [`32da78b`](https://github.com/segmentio/analytics-next/commit/32da78b922d6ffe030585dc7ba1b271b78d5f6dd) Thanks [@silesky](https://github.com/silesky)! - Support older browsers

## 0.2.0

### Minor Changes

- [#941](https://github.com/segmentio/analytics-next/pull/941) [`d8c5ad9`](https://github.com/segmentio/analytics-next/commit/d8c5ad9dff06e42656504657fdd27e6a67b875e3) Thanks [@silesky](https://github.com/silesky)! - Tighten up analytics types

### Patch Changes

- [#941](https://github.com/segmentio/analytics-next/pull/941) [`d8c5ad9`](https://github.com/segmentio/analytics-next/commit/d8c5ad9dff06e42656504657fdd27e6a67b875e3) Thanks [@silesky](https://github.com/silesky)! - - Fix `onConsentChanged` not firing in snippet environment due to to stale analytics reference.
  - Register `onConsentChanged` early in the wrapper initialization sequence so it can catch consent changed events that occur before analytics is loaded.

## 0.1.1

### Patch Changes

- [#938](https://github.com/segmentio/analytics-next/pull/938) [`2191eb3`](https://github.com/segmentio/analytics-next/commit/2191eb34b501c21f963f0e39426f89b5e6baed39) Thanks [@silesky](https://github.com/silesky)! - Have `createWrapper` return analytics instance to allow `.load` to be chained.

## 0.1.0

### Minor Changes

- [#936](https://github.com/segmentio/analytics-next/pull/936) [`a7a0882`](https://github.com/segmentio/analytics-next/commit/a7a08827cc31dd3a558700143828ab43d27f2125) Thanks [@silesky](https://github.com/silesky)! - Add consent changed event

## 0.0.4

### Patch Changes

- [#912](https://github.com/segmentio/analytics-next/pull/912) [`70cc6e6`](https://github.com/segmentio/analytics-next/commit/70cc6e61a809bd44a9e34555b64da9a3b8672fdf) Thanks [@silesky](https://github.com/silesky)! - Support classic destinations and locally installed action destinations by removing integrations.

* [#918](https://github.com/segmentio/analytics-next/pull/918) [`fd0862c`](https://github.com/segmentio/analytics-next/commit/fd0862c544d4418719863e8f5418b5ab61a9ca5e) Thanks [@silesky](https://github.com/silesky)! - Remove default behavior that prunes unmapped categories from context.contest payload. As such, by default, `allKeys` will no longer be used. Add ability to turn pruning back on via an `pruneUnmappedCategories` setting.

## 0.0.3

### Patch Changes

- [#899](https://github.com/segmentio/analytics-next/pull/899) [`d9e135a`](https://github.com/segmentio/analytics-next/commit/d9e135a7174ce0a4d90fe1339c4833bd86b8f429) Thanks [@silesky](https://github.com/silesky)! - Validate categories for consent stamping

* [#898](https://github.com/segmentio/analytics-next/pull/898) [`6789f9b`](https://github.com/segmentio/analytics-next/commit/6789f9b213f63698da8ca67d6631966aefc58345) Thanks [@silesky](https://github.com/silesky)! - Change meaning of consent to 'user has consented ALL categories'

## 0.0.2

### Patch Changes

- [#892](https://github.com/segmentio/analytics-next/pull/892) [`1d08764`](https://github.com/segmentio/analytics-next/commit/1d087647fd359b6332d597ae5b640decb3e86670) Thanks [@silesky](https://github.com/silesky)! - Make package work with next 12 and next 13 without transpiling.

## 0.0.1

### Patch Changes

- [#873](https://github.com/segmentio/analytics-next/pull/873) [`1e2d003`](https://github.com/segmentio/analytics-next/commit/1e2d003e28bc35266b8de925d67a09376cab255d) Thanks [@silesky](https://github.com/silesky)! - Release analytics-consent-tools
