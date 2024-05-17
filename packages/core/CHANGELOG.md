# @segment/analytics-core

## 1.6.0

### Minor Changes

- [#1080](https://github.com/segmentio/analytics-next/pull/1080) [`e884b61`](https://github.com/segmentio/analytics-next/commit/e884b6119db4ddbc557577539aa91b95481776a2) Thanks [@silesky](https://github.com/silesky)! - Do not throw errors in .register() method.

* [#1080](https://github.com/segmentio/analytics-next/pull/1080) [`e884b61`](https://github.com/segmentio/analytics-next/commit/e884b6119db4ddbc557577539aa91b95481776a2) Thanks [@silesky](https://github.com/silesky)! - Addresses an issue where, if one of the non-destination actions fails to load/is blocked, the entire SDK fails to load. This is most notable in GA4, where, if GA was blocked, Segment initialization would fail.

## 1.5.1

### Patch Changes

- [#1045](https://github.com/segmentio/analytics-next/pull/1045) [`3c37def`](https://github.com/segmentio/analytics-next/commit/3c37def422f82073e7e33d2d7c7c26c4637afdc9) Thanks [@silesky](https://github.com/silesky)! - Share `EventFactory` between node and browser.

* [#1076](https://github.com/segmentio/analytics-next/pull/1076) [`1635e42`](https://github.com/segmentio/analytics-next/commit/1635e42ffae8fd8e8d18be94f47a22a802fecec8) Thanks [@chrisradek](https://github.com/chrisradek)! - Fixes an issue introduced in v1.66.0 that caused analytics plugins to be removed from event processing if a destination threw an error while loading.

## 1.5.0

### Minor Changes

- [#945](https://github.com/segmentio/analytics-next/pull/945) [`d212633`](https://github.com/segmentio/analytics-next/commit/d21263369d5980f4f57b13795524dbc345a02e5c) Thanks [@zikaari](https://github.com/zikaari)! - Load destinations lazily and start sending events as each becomes available instead of waiting for all to load first

### Patch Changes

- [#1043](https://github.com/segmentio/analytics-next/pull/1043) [`95fd2fd`](https://github.com/segmentio/analytics-next/commit/95fd2fd801da26505ddcead96ffaa83aa4364994) Thanks [@silesky](https://github.com/silesky)! - This ensures backward compatibility with analytics-node by modifying '@segment/analytics-core'. Specifically, the changes prevent the generation of a messageId if it is already set. This adjustment aligns with the behavior outlined in analytics-node's source code [here](https://github.com/segmentio/analytics-node/blob/master/index.js#L195-L201).

  While this is a core release, only the node library is affected, as the browser has its own EventFactory atm.

- Updated dependencies [[`d212633`](https://github.com/segmentio/analytics-next/commit/d21263369d5980f4f57b13795524dbc345a02e5c)]:
  - @segment/analytics-generic-utils@1.2.0

## 1.4.1

### Patch Changes

- Updated dependencies [[`7b93e7b`](https://github.com/segmentio/analytics-next/commit/7b93e7b50fa293aebaf6767a44bf7708b231d5cd)]:
  - @segment/analytics-generic-utils@1.1.1

## 1.4.0

### Minor Changes

- [#993](https://github.com/segmentio/analytics-next/pull/993) [`d9b47c4`](https://github.com/segmentio/analytics-next/commit/d9b47c43e5e08efce14fe4150536ff60b8df91e0) Thanks [@silesky](https://github.com/silesky)! - Consume Emitter module from `@segment/analytics-generic-utils`

### Patch Changes

- Updated dependencies [[`d9b47c4`](https://github.com/segmentio/analytics-next/commit/d9b47c43e5e08efce14fe4150536ff60b8df91e0)]:
  - @segment/analytics-generic-utils@1.1.0

## 1.3.2

### Patch Changes

- [#852](https://github.com/segmentio/analytics-next/pull/852) [`897f4cc`](https://github.com/segmentio/analytics-next/commit/897f4cc69de4cdd38efd0cd70567bfed0c454fec) Thanks [@silesky](https://github.com/silesky)! - Tighten isPlainObject type guard

## 1.3.1

### Patch Changes

- [#939](https://github.com/segmentio/analytics-next/pull/939) [`ee855ba`](https://github.com/segmentio/analytics-next/commit/ee855bad751c393a40dcbde7ae861f27d2b4da26) Thanks [@zikaari](https://github.com/zikaari)! - Update Campaign type to be more relaxed

## 1.3.0

### Minor Changes

- [#864](https://github.com/segmentio/analytics-next/pull/864) [`6cba535`](https://github.com/segmentio/analytics-next/commit/6cba5356c5f751e3edb30f7f524d4498600895b0) Thanks [@danieljackins](https://github.com/danieljackins)! - Add Client Hints API support

## 1.2.5

### Patch Changes

- [#846](https://github.com/segmentio/analytics-next/pull/846) [`7dcafa2`](https://github.com/segmentio/analytics-next/commit/7dcafa29cbce86d8c3d3c829c3ba7c22148949fc) Thanks [@silesky](https://github.com/silesky)! - Remove browser-specific isOffline() logic from core

## 1.2.4

### Patch Changes

- [#835](https://github.com/segmentio/analytics-next/pull/835) [`9353e09`](https://github.com/segmentio/analytics-next/commit/9353e0999f942db33066e337e9742ac2e96716b7) Thanks [@silesky](https://github.com/silesky)! - Refactor shared validation logic. Create granular error message if user ID does not match string type.

## 1.2.3

### Patch Changes

- [#805](https://github.com/segmentio/analytics-next/pull/805) [`afb027a`](https://github.com/segmentio/analytics-next/commit/afb027a5b6287fa520283172392b0c39a628a6ae) Thanks [@silesky](https://github.com/silesky)! - Upgrade typescript

## 1.2.2

### Patch Changes

- [#774](https://github.com/segmentio/analytics-next/pull/774) [`69154c3`](https://github.com/segmentio/analytics-next/commit/69154c31f0739c3d1e31c3fd4d0f075fac721289) Thanks [@zikaari](https://github.com/zikaari)! - Add useQueryString option to InitOptions

## 1.2.1

### Patch Changes

- [#764](https://github.com/segmentio/analytics-next/pull/764) [`43897d6`](https://github.com/segmentio/analytics-next/commit/43897d6ffc5f6c7be6a9dec569997348b8c93e51) Thanks [@zikaari](https://github.com/zikaari)! - Add comprehensive message lifecycle events

## 1.2.0

### Minor Changes

- [#738](https://github.com/segmentio/analytics-next/pull/738) [`fed489c`](https://github.com/segmentio/analytics-next/commit/fed489cbf2e5b4c0f8423453e24831ec5dcdd7ce) Thanks [@silesky](https://github.com/silesky)! - Make trait fields nullable. Type traits for group() differently than identify() call.

* [#722](https://github.com/segmentio/analytics-next/pull/722) [`61688e2`](https://github.com/segmentio/analytics-next/commit/61688e251ad2f60dae4cfd65cf59401c29ec66bd) Thanks [@silesky](https://github.com/silesky)! - Improve core interfaces. Refactor analytics-next to use shared EventQueue, dispatch, and other methods.
  Augment Browser interface with traits and context options type.

## 1.1.6

### Patch Changes

- [#718](https://github.com/segmentio/analytics-next/pull/718) [`80e0d0a`](https://github.com/segmentio/analytics-next/commit/80e0d0a7d074422654cbebe0c3edb90e1d42ad62) Thanks [@silesky](https://github.com/silesky)! - Change emitter message to dispatch_start

## 1.1.5

### Patch Changes

- [#702](https://github.com/segmentio/analytics-next/pull/702) [`90b915a`](https://github.com/segmentio/analytics-next/commit/90b915ac3447d76673e98661c54bf5a0ced2a555) Thanks [@silesky](https://github.com/silesky)! - EventFactory should filter out option keys with undefined values

* [#709](https://github.com/segmentio/analytics-next/pull/709) [`108c77e`](https://github.com/segmentio/analytics-next/commit/108c77e81a4e9d2a64eb56e78f707ae6c2ea6ed2) Thanks [@silesky](https://github.com/silesky)! - Improve types for context and traits and fix SegmentEvent context type (node only ATM). Refactor context eventFactory to clarify.

## 1.1.4

### Patch Changes

- [#692](https://github.com/segmentio/analytics-next/pull/692) [`ecb4b8d`](https://github.com/segmentio/analytics-next/commit/ecb4b8db0194e06a3ee3c8cae57d4f327d15dc02) Thanks [@silesky](https://github.com/silesky)! - Move code out of core and into analytics-node. Tweak emitter error contract.

## 1.1.3

### Patch Changes

- [#699](https://github.com/segmentio/analytics-next/pull/699) [`0b9f4d7`](https://github.com/segmentio/analytics-next/commit/0b9f4d7e82662f7d5fda3590e93b10b3fd2e9833) Thanks [@silesky](https://github.com/silesky)! - Fix missing core dependency (@lukeed/uuid)

## 1.1.2

### Patch Changes

- [#670](https://github.com/segmentio/analytics-next/pull/670) [`98d1b12`](https://github.com/segmentio/analytics-next/commit/98d1b127082f5fc7904980a561220c64c26edff3) Thanks [@silesky](https://github.com/silesky)! - Allow consumers to inject custom messageId into EventFactory, allowing us to remove node transient dependency on md5 library. Change node messageId to format "node-next-[unix epoch time]-[uuid]".

## 1.1.1

### Patch Changes

- [#658](https://github.com/segmentio/analytics-next/pull/658) [`409cae4`](https://github.com/segmentio/analytics-next/commit/409cae4b9ac404277aa44bab7428186129b42a35) Thanks [@silesky](https://github.com/silesky)! - Clean up dead code.

## 1.1.0

### Minor Changes

- [#587](https://github.com/segmentio/analytics-next/pull/587) [`598fc31`](https://github.com/segmentio/analytics-next/commit/598fc318a457ac6e5b04d04406f8d836d83763a4) Thanks [@silesky](https://github.com/silesky)! - Migrate shared code into core.

### Patch Changes

- [#602](https://github.com/segmentio/analytics-next/pull/602) [`4644afc`](https://github.com/segmentio/analytics-next/commit/4644afc5be2dac90465e16a485ef5c34ff694da3) Thanks [@silesky](https://github.com/silesky)! - Fix bug where delay and pTimeout are coupled

* [#603](https://github.com/segmentio/analytics-next/pull/603) [`ce90543`](https://github.com/segmentio/analytics-next/commit/ce905439355c1cbd306535600bf356710be147de) Thanks [@silesky](https://github.com/silesky)! - Remove extraneous code from EQ

- [#593](https://github.com/segmentio/analytics-next/pull/593) [`7b5d3df`](https://github.com/segmentio/analytics-next/commit/7b5d3df8d7d8e479d1dda4557297baedb3cdcf6f) Thanks [@silesky](https://github.com/silesky)! - Revise NodeJS public API. Fix core so Node SDK waits for plugins to be registered before dispatching any events.

## 1.0.1

### Patch Changes

- [#547](https://github.com/segmentio/analytics-next/pull/547) [`93c8f1f`](https://github.com/segmentio/analytics-next/commit/93c8f1f7dabe6fca5bd0f8f9f0cc0c0e14cd2128) Thanks [@silesky](https://github.com/silesky)! - Fix "failed to parse source map" in analytics-core ([#420](https://github.com/segmentio/analytics-next/issues/420))
