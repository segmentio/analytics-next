# @segment/analytics-next

## 1.73.0

### Minor Changes

- [#1084](https://github.com/segmentio/analytics-next/pull/1084) [`5647624c`](https://github.com/segmentio/analytics-next/commit/5647624cbcd4984e5bdbf2e9c907619366864c4e) Thanks [@MichaelGHSeg](https://github.com/MichaelGHSeg)! - Adding support for 429 response from the server

### Patch Changes

- Updated dependencies [[`5647624c`](https://github.com/segmentio/analytics-next/commit/5647624cbcd4984e5bdbf2e9c907619366864c4e)]:
  - @segment/analytics-core@1.7.0

## 1.72.2

### Patch Changes

- [#1125](https://github.com/segmentio/analytics-next/pull/1125) [`7aed96e`](https://github.com/segmentio/analytics-next/commit/7aed96eac40a83bd392daa91838ed1f46e2dc9fd) Thanks [@silesky](https://github.com/silesky)! - Update init to allow for asset path overriding and fix debugging experience

* [#1121](https://github.com/segmentio/analytics-next/pull/1121) [`d98dcd2`](https://github.com/segmentio/analytics-next/commit/d98dcd2f16aa8a8940e72fde0ba75d7974fe45fa) Thanks [@silesky](https://github.com/silesky)! - Fix enrichment plugins not waiting for .load to resolve when plugin is registered manually

- [#1127](https://github.com/segmentio/analytics-next/pull/1127) [`6bfaa3e`](https://github.com/segmentio/analytics-next/commit/6bfaa3e9d9ca767f54bb8185744e94be08ce9bc8) Thanks [@silesky](https://github.com/silesky)! - If npm version, do not read buffered events from window.analytics

## 1.72.1

### Patch Changes

- [#1115](https://github.com/segmentio/analytics-next/pull/1115) [`73ac593`](https://github.com/segmentio/analytics-next/commit/73ac593226159423b2f63cac190eebd347bbb75a) Thanks [@silesky](https://github.com/silesky)! - Update argument resolver to user interface rather than full User

## 1.72.0

### Minor Changes

- [#1107](https://github.com/segmentio/analytics-next/pull/1107) [`91e72ba`](https://github.com/segmentio/analytics-next/commit/91e72ba302fc45b4adb7aaeeb0a1f4ce3582dda6) Thanks [@silesky](https://github.com/silesky)! - Vendor tsub.js 2.0.0

## 1.71.0

### Minor Changes

- [#1101](https://github.com/segmentio/analytics-next/pull/1101) [`aee18d2`](https://github.com/segmentio/analytics-next/commit/aee18d222ddfb2273399987fabf92b54876f5e88) Thanks [@silesky](https://github.com/silesky)! - Export segment plugin and arg resolvers

* [#1100](https://github.com/segmentio/analytics-next/pull/1100) [`e60f625`](https://github.com/segmentio/analytics-next/commit/e60f6252687d977b76b09ca9b756c790d341111a) Thanks [@danieljackins](https://github.com/danieljackins)! - Flush large keepalive requests

### Patch Changes

- [#1101](https://github.com/segmentio/analytics-next/pull/1101) [`aee18d2`](https://github.com/segmentio/analytics-next/commit/aee18d222ddfb2273399987fabf92b54876f5e88) Thanks [@silesky](https://github.com/silesky)! - Add edgeFunction to CDNSettings type

## 1.70.0

### Minor Changes

- [#1088](https://github.com/segmentio/analytics-next/pull/1088) [`2299e9a`](https://github.com/segmentio/analytics-next/commit/2299e9a7a83f421f0bbf7fac03abc9c030296cac) Thanks [@silesky](https://github.com/silesky)! - Refactor to change interface name from `legacySettings` -> `cdnSettings`, in order to clarify code.

* [#1090](https://github.com/segmentio/analytics-next/pull/1090) [`b611746`](https://github.com/segmentio/analytics-next/commit/b611746e23c1fab7321bb4d100f236813ffb416c) Thanks [@silesky](https://github.com/silesky)! - - Add public settings API
  - Do not expose loadLegacySettings / loadCDNSettings (private API)

## 1.69.0

### Minor Changes

- [#1080](https://github.com/segmentio/analytics-next/pull/1080) [`e884b61`](https://github.com/segmentio/analytics-next/commit/e884b6119db4ddbc557577539aa91b95481776a2) Thanks [@silesky](https://github.com/silesky)! - Addresses an issue where, if one of the non-destination actions fails to load/is blocked, the entire SDK fails to load. This is most notable in GA4, where, if GA was blocked, Segment initialization would fail.

### Patch Changes

- Updated dependencies [[`e884b61`](https://github.com/segmentio/analytics-next/commit/e884b6119db4ddbc557577539aa91b95481776a2), [`e884b61`](https://github.com/segmentio/analytics-next/commit/e884b6119db4ddbc557577539aa91b95481776a2)]:
  - @segment/analytics-core@1.6.0

## 1.68.0

### Minor Changes

- [#1045](https://github.com/segmentio/analytics-next/pull/1045) [`3c37def`](https://github.com/segmentio/analytics-next/commit/3c37def422f82073e7e33d2d7c7c26c4637afdc9) Thanks [@silesky](https://github.com/silesky)! - - Remove validation plugin
  - Remove `spark-md5` dependency
  - Update messageId algorithm to be consistent with node (analytics-next-[epoch time]-[uuid])
  - Browser Validation:
    - Throws errors in the EventFactory (not just in a plugin) if the event is invalid

### Patch Changes

- Updated dependencies [[`3c37def`](https://github.com/segmentio/analytics-next/commit/3c37def422f82073e7e33d2d7c7c26c4637afdc9), [`1635e42`](https://github.com/segmentio/analytics-next/commit/1635e42ffae8fd8e8d18be94f47a22a802fecec8)]:
  - @segment/analytics-core@1.5.1

## 1.67.0

### Minor Changes

- [#1053](https://github.com/segmentio/analytics-next/pull/1053) [`fd09fbc`](https://github.com/segmentio/analytics-next/commit/fd09fbcc943449eccbfe985dfed083b746bd2cab) Thanks [@silesky](https://github.com/silesky)! - Allow `*` in integration name field to apply middleware to all destinations plugins.
  ```ts
  addDestinationMiddleware('*', ({ ... }) => {
   ...
  })
  ```

### Patch Changes

- [#1067](https://github.com/segmentio/analytics-next/pull/1067) [`e3f3bee`](https://github.com/segmentio/analytics-next/commit/e3f3bee5831abbe9b3005f77266f72ccda65f9e6) Thanks [@oscb](https://github.com/oscb)! - fix: fixes buffering for legacy destinations

## 1.66.0

### Minor Changes

- [#1037](https://github.com/segmentio/analytics-next/pull/1037) [`e435279`](https://github.com/segmentio/analytics-next/commit/e4352792ed5e58a95009a28d83abb8cfea308a82) Thanks [@danieljackins](https://github.com/danieljackins)! - Allow custom metrics endpoint on load

## 1.65.0

### Minor Changes

- [#945](https://github.com/segmentio/analytics-next/pull/945) [`d212633`](https://github.com/segmentio/analytics-next/commit/d21263369d5980f4f57b13795524dbc345a02e5c) Thanks [@zikaari](https://github.com/zikaari)! - Load destinations lazily and start sending events as each becomes available instead of waiting for all to load first

### Patch Changes

- [#1036](https://github.com/segmentio/analytics-next/pull/1036) [`f65c131`](https://github.com/segmentio/analytics-next/commit/f65c131a62f979b6629b086b3eb9cd9b3ffefe31) Thanks [@danieljackins](https://github.com/danieljackins)! - Fix schema-filter bug

- Updated dependencies [[`95fd2fd`](https://github.com/segmentio/analytics-next/commit/95fd2fd801da26505ddcead96ffaa83aa4364994), [`d212633`](https://github.com/segmentio/analytics-next/commit/d21263369d5980f4f57b13795524dbc345a02e5c)]:
  - @segment/analytics-core@1.5.0
  - @segment/analytics-generic-utils@1.2.0

## 1.64.0

### Minor Changes

- [#1032](https://github.com/segmentio/analytics-next/pull/1032) [`5c1511f`](https://github.com/segmentio/analytics-next/commit/5c1511fe1e1d1df94967623b29ec12ffe770aacf) Thanks [@zikaari](https://github.com/zikaari)! - Support loading analytics into a custom global variable when using snippet version 5.2.1 or later

## 1.63.0

### Minor Changes

- [#1008](https://github.com/segmentio/analytics-next/pull/1008) [`e57960e`](https://github.com/segmentio/analytics-next/commit/e57960e84f5ce5b214dde09928bee6e6bdba3a69) Thanks [@danieljackins](https://github.com/danieljackins)! - Change segmentio to destination type

* [#1023](https://github.com/segmentio/analytics-next/pull/1023) [`b5b929e`](https://github.com/segmentio/analytics-next/commit/b5b929ea432198ae6aecb2b03ea2194972bcc029) Thanks [@silesky](https://github.com/silesky)! - Deprecate AnalyticsNode class (in favor of the standalone @segment/analytics-node)

## 1.62.1

### Patch Changes

- [#1009](https://github.com/segmentio/analytics-next/pull/1009) [`f476038`](https://github.com/segmentio/analytics-next/commit/f47603881b787cc81fa1da4496bdbde9eb325a0f) Thanks [@silesky](https://github.com/silesky)! - If initialPageview is true, capture page context as early as possible

- Updated dependencies [[`7b93e7b`](https://github.com/segmentio/analytics-next/commit/7b93e7b50fa293aebaf6767a44bf7708b231d5cd)]:
  - @segment/analytics-generic-utils@1.1.1
  - @segment/analytics-core@1.4.1

## 1.62.0

### Minor Changes

- [#992](https://github.com/segmentio/analytics-next/pull/992) [`a72f473`](https://github.com/segmentio/analytics-next/commit/a72f4736a743e6a6487fd7b5c764639402f9e7ba) Thanks [@silesky](https://github.com/silesky)! - Add 'disable' boolean option to allow for disabling Segment in a testing environment.

### Patch Changes

- [#1001](https://github.com/segmentio/analytics-next/pull/1001) [`57be1ac`](https://github.com/segmentio/analytics-next/commit/57be1acd556a9779edbc5fd4d3f820fb50b65697) Thanks [@silesky](https://github.com/silesky)! - add hasUnmappedDestinations property to types

- Updated dependencies [[`d9b47c4`](https://github.com/segmentio/analytics-next/commit/d9b47c43e5e08efce14fe4150536ff60b8df91e0), [`d9b47c4`](https://github.com/segmentio/analytics-next/commit/d9b47c43e5e08efce14fe4150536ff60b8df91e0)]:
  - @segment/analytics-core@1.4.0
  - @segment/analytics-generic-utils@1.1.0

## 1.61.0

### Minor Changes

- [#985](https://github.com/segmentio/analytics-next/pull/985) [`083f9a1`](https://github.com/segmentio/analytics-next/commit/083f9a18e2cde4132cd31a61d76f26d07c35cad9) Thanks [@zikaari](https://github.com/zikaari)! - Update integration metrics capturing strategy

## 1.60.0

### Minor Changes

- [#989](https://github.com/segmentio/analytics-next/pull/989) [`1faabf1`](https://github.com/segmentio/analytics-next/commit/1faabf1f51de63423f8995adf837137ab2d9d800) Thanks [@silesky](https://github.com/silesky)! - Change default retries to 10 to match docs + ajs classic

## 1.59.0

### Minor Changes

- [#971](https://github.com/segmentio/analytics-next/pull/971) [`2f1ae75`](https://github.com/segmentio/analytics-next/commit/2f1ae75896123e0aeaa1608fde15312adddd5614) Thanks [@zikaari](https://github.com/zikaari)! - Capture action plugin metrics

### Patch Changes

- [#950](https://github.com/segmentio/analytics-next/pull/950) [`c0dadc7`](https://github.com/segmentio/analytics-next/commit/c0dadc759dccd88c6d95d14fcf7732fad2b051a1) Thanks [@oscb](https://github.com/oscb)! - Fixes calls to .identify() with null as id

## 1.58.0

### Minor Changes

- [#852](https://github.com/segmentio/analytics-next/pull/852) [`897f4cc`](https://github.com/segmentio/analytics-next/commit/897f4cc69de4cdd38efd0cd70567bfed0c454fec) Thanks [@silesky](https://github.com/silesky)! - - Capture page context information faster, so context.campaign and context.page are more resilient to quick navigation changes.
  - Parse UTM params into context.campaign if users pass an object to a page call.

### Patch Changes

- Updated dependencies [[`897f4cc`](https://github.com/segmentio/analytics-next/commit/897f4cc69de4cdd38efd0cd70567bfed0c454fec)]:
  - @segment/analytics-core@1.3.2

## 1.57.0

### Minor Changes

- [#956](https://github.com/segmentio/analytics-next/pull/956) [`f5cdb82`](https://github.com/segmentio/analytics-next/commit/f5cdb824050c22a9aaa86a450b8f1f4a7f4fb144) Thanks [@danieljackins](https://github.com/danieljackins)! - Set timezone and allow userAgentData to be overridden

## 1.56.0

### Minor Changes

- [#928](https://github.com/segmentio/analytics-next/pull/928) [`7f4232c`](https://github.com/segmentio/analytics-next/commit/7f4232cbdb60a4475c565e5d262b25182e47baf4) Thanks [@oscb](https://github.com/oscb)! - Adds `globalAnalyticsKey` option for setting custom global window buffers

### Patch Changes

- [#949](https://github.com/segmentio/analytics-next/pull/949) [`fcf42f6`](https://github.com/segmentio/analytics-next/commit/fcf42f68b4226b55417bbaeb6305d33129ede96d) Thanks [@silesky](https://github.com/silesky)! - Fix regression where we no longer export UniversalStorage (used in destinations)

## 1.55.0

### Minor Changes

- [#939](https://github.com/segmentio/analytics-next/pull/939) [`ee855ba`](https://github.com/segmentio/analytics-next/commit/ee855bad751c393a40dcbde7ae861f27d2b4da26) Thanks [@zikaari](https://github.com/zikaari)! - Move context augmentation to Page Enrichment plugin

* [#931](https://github.com/segmentio/analytics-next/pull/931) [`9123c0c`](https://github.com/segmentio/analytics-next/commit/9123c0c485d293ee8ba283ba7b6de6a46734449a) Thanks [@silesky](https://github.com/silesky)! - Add ability to use browser destination straight from NPM

### Patch Changes

- Updated dependencies [[`ee855ba`](https://github.com/segmentio/analytics-next/commit/ee855bad751c393a40dcbde7ae861f27d2b4da26)]:
  - @segment/analytics-core@1.3.1

## 1.54.0

### Minor Changes

- [#908](https://github.com/segmentio/analytics-next/pull/908) [`1b95946`](https://github.com/segmentio/analytics-next/commit/1b95946339d32a0395ab6bf56e37ecbd6eb832ae) Thanks [@oscb](https://github.com/oscb)! - Adds storage option in analytics client to specify priority of storage (e.g use cookies over localstorage)

## 1.53.4

### Patch Changes

- [#932](https://github.com/segmentio/analytics-next/pull/932) [`b1584fc`](https://github.com/segmentio/analytics-next/commit/b1584fc1dc531b312dc6020fadc1c14bd153a557) Thanks [@oscb](https://github.com/oscb)! - `sentAt` is not set at batch upload time once per the whole batch. Individual event `sentAt` property is stripped when doing batch uploading.

## 1.53.3

### Patch Changes

- [#915](https://github.com/segmentio/analytics-next/pull/915) [`7072377`](https://github.com/segmentio/analytics-next/commit/7072377c0adae54b844a441fa545763e0ff654ba) Thanks [@danieljackins](https://github.com/danieljackins)! - Fix batching after page navigation

## 1.53.2

### Patch Changes

- [#888](https://github.com/segmentio/analytics-next/pull/888) [`f3183f2`](https://github.com/segmentio/analytics-next/commit/f3183f2163d93f98ce2f8dd7830d2bca3b47f537) Thanks [@danieljackins](https://github.com/danieljackins)! - Fix query string parsing bug that was causing events containing the 'search' property with a non string value to be dropped

* [#891](https://github.com/segmentio/analytics-next/pull/891) [`e0c7792`](https://github.com/segmentio/analytics-next/commit/e0c7792924e6f7ba0a36c200c5468141de3b9320) Thanks [@zikaari](https://github.com/zikaari)! - Fix cookie write error

## 1.53.1

### Patch Changes

- [#900](https://github.com/segmentio/analytics-next/pull/900) [`9c8b609`](https://github.com/segmentio/analytics-next/commit/9c8b609f500d2338fdbf2572639241ffdfd27f8f) Thanks [@silesky](https://github.com/silesky)! - Add consent info to typescript types

* [#896](https://github.com/segmentio/analytics-next/pull/896) [`48ce3ec`](https://github.com/segmentio/analytics-next/commit/48ce3ecbdea9361dde90481d7c50207613602d52) Thanks [@oscb](https://github.com/oscb)! - Added support for `screen` events for Segment destination

## 1.53.0

### Minor Changes

- [#870](https://github.com/segmentio/analytics-next/pull/870) [`f23f3be`](https://github.com/segmentio/analytics-next/commit/f23f3bec9a774d9e6df8e243ab8e2711bacedd37) Thanks [@silesky](https://github.com/silesky)! - Add updateCDNSettings option

* [#864](https://github.com/segmentio/analytics-next/pull/864) [`6cba535`](https://github.com/segmentio/analytics-next/commit/6cba5356c5f751e3edb30f7f524d4498600895b0) Thanks [@danieljackins](https://github.com/danieljackins)! - Add Client Hints API support

### Patch Changes

- Updated dependencies [[`6cba535`](https://github.com/segmentio/analytics-next/commit/6cba5356c5f751e3edb30f7f524d4498600895b0)]:
  - @segment/analytics-core@1.3.0

## 1.52.0

### Minor Changes

- [#867](https://github.com/segmentio/analytics-next/pull/867) [`2b3e5e4`](https://github.com/segmentio/analytics-next/commit/2b3e5e470b39ba6e23b90a8b2e61c6ed22b0fd6c) Thanks [@zikaari](https://github.com/zikaari)! - Device mode destination filters will now filter properties within arrays, just like they do in cloud mode

### Patch Changes

- [#861](https://github.com/segmentio/analytics-next/pull/861) [`99402e9`](https://github.com/segmentio/analytics-next/commit/99402e93902b6e5d02b8abe6944cc2f87255ca41) Thanks [@chrisradek](https://github.com/chrisradek)! - Fixes issue related to how retried events are stored in localStorage to prevent analytics.js from reading events for a different writeKey when that writeKey is used on the same domain as the current analytics.js.

## 1.51.7

### Patch Changes

- Updated dependencies [[`7dcafa2`](https://github.com/segmentio/analytics-next/commit/7dcafa29cbce86d8c3d3c829c3ba7c22148949fc)]:
  - @segment/analytics-core@1.2.5

## 1.51.6

### Patch Changes

- [#842](https://github.com/segmentio/analytics-next/pull/842) [`2b71c10`](https://github.com/segmentio/analytics-next/commit/2b71c102519c12b056b596950f17e5c95fe5e41b) Thanks [@silesky](https://github.com/silesky)! - Fix 'Promise is undefined' issue with ie11 polyfill

## 1.51.5

### Patch Changes

- [#838](https://github.com/segmentio/analytics-next/pull/838) [`55a48a0`](https://github.com/segmentio/analytics-next/commit/55a48a0d1e3589fc6b4896e94b79c857cabf1006) Thanks [@silesky](https://github.com/silesky)! - Refactor page enrichment to only call page defaults once, and simplify logic

* [#839](https://github.com/segmentio/analytics-next/pull/839) [`fdc004b`](https://github.com/segmentio/analytics-next/commit/fdc004bebaa48206c710aab703b164b41e8fa984) Thanks [@silesky](https://github.com/silesky)! - Fixes a utm-parameter parsing bug where overridden page.search properties would not be reflected in the context.campaign object

  ```ts
  analytics.page(undefined, undefined, {search: "?utm_source=123&utm_content=content" )
  analytics.track("foo", {url: "....", search: "?utm_source=123&utm_content=content" )

  // should result in a context.campaign of:
  { source: 123, content: 'content'}
  ```

## 1.51.4

### Patch Changes

- [#835](https://github.com/segmentio/analytics-next/pull/835) [`9353e09`](https://github.com/segmentio/analytics-next/commit/9353e0999f942db33066e337e9742ac2e96716b7) Thanks [@silesky](https://github.com/silesky)! - Refactor shared validation logic. Create granular error message if user ID does not match string type.

- Updated dependencies [[`9353e09`](https://github.com/segmentio/analytics-next/commit/9353e0999f942db33066e337e9742ac2e96716b7)]:
  - @segment/analytics-core@1.2.4

## 1.51.3

### Patch Changes

- [`0616559`](https://github.com/segmentio/analytics-next/commit/0616559f6e07850f1519b4e3fd583f818593b6ea) Thanks [@silesky](https://github.com/silesky)! - Add better CSP errors and metrics

## 1.51.2

### Patch Changes

- [#805](https://github.com/segmentio/analytics-next/pull/805) [`afb027a`](https://github.com/segmentio/analytics-next/commit/afb027a5b6287fa520283172392b0c39a628a6ae) Thanks [@silesky](https://github.com/silesky)! - Upgrade typescript

- Updated dependencies [[`afb027a`](https://github.com/segmentio/analytics-next/commit/afb027a5b6287fa520283172392b0c39a628a6ae)]:
  - @segment/analytics-core@1.2.3

## 1.51.1

### Patch Changes

- [#800](https://github.com/segmentio/analytics-next/pull/800) [`fe98d5e`](https://github.com/segmentio/analytics-next/commit/fe98d5ee2229f456830e677df361d2d5cd16e545) Thanks [@silesky](https://github.com/silesky)! - Fix staging-only bug where integrations URL would not respect CDN URL overrides

## 1.51.0

### Minor Changes

- [#788](https://github.com/segmentio/analytics-next/pull/788) [`6fbae8d`](https://github.com/segmentio/analytics-next/commit/6fbae8d547eff41d9d901bdbd0fdb8ff4dcf1002) Thanks [@silesky](https://github.com/silesky)! - Make keep-alive configurable and default to false

## 1.50.0

### Minor Changes

- [#774](https://github.com/segmentio/analytics-next/pull/774) [`69154c3`](https://github.com/segmentio/analytics-next/commit/69154c31f0739c3d1e31c3fd4d0f075fac721289) Thanks [@zikaari](https://github.com/zikaari)! - Add useQueryString option to InitOptions

* [#787](https://github.com/segmentio/analytics-next/pull/787) [`171cd15`](https://github.com/segmentio/analytics-next/commit/171cd15b4c32f4c0780c1e3d8d6d646bb17c6c36) Thanks [@silesky](https://github.com/silesky)! - Add keep-alive header to fetch for standard transport.

### Patch Changes

- Updated dependencies [[`69154c3`](https://github.com/segmentio/analytics-next/commit/69154c31f0739c3d1e31c3fd4d0f075fac721289)]:
  - @segment/analytics-core@1.2.2

## 1.49.2

### Patch Changes

- [#764](https://github.com/segmentio/analytics-next/pull/764) [`43897d6`](https://github.com/segmentio/analytics-next/commit/43897d6ffc5f6c7be6a9dec569997348b8c93e51) Thanks [@zikaari](https://github.com/zikaari)! - Add comprehensive message lifecycle events

* [#758](https://github.com/segmentio/analytics-next/pull/758) [`ef47e9e`](https://github.com/segmentio/analytics-next/commit/ef47e9e469390062b44790b6f92bb976708fab71) Thanks [@zikaari](https://github.com/zikaari)! - Remove direct wirings for Segment Inspector

* Updated dependencies [[`43897d6`](https://github.com/segmentio/analytics-next/commit/43897d6ffc5f6c7be6a9dec569997348b8c93e51)]:
  - @segment/analytics-core@1.2.1

## 1.49.1

### Patch Changes

- [#749](https://github.com/segmentio/analytics-next/pull/749) [`86b9857`](https://github.com/segmentio/analytics-next/commit/86b98572a24bfc7c8b6feea8a6feef1bdbe9202a) Thanks [@silesky](https://github.com/silesky)! - Fix internal lib error by removing path alias.

## 1.49.0

### Minor Changes

- [#738](https://github.com/segmentio/analytics-next/pull/738) [`fed489c`](https://github.com/segmentio/analytics-next/commit/fed489cbf2e5b4c0f8423453e24831ec5dcdd7ce) Thanks [@silesky](https://github.com/silesky)! - Make trait fields nullable. Type traits for group() differently than identify() call.

* [#722](https://github.com/segmentio/analytics-next/pull/722) [`61688e2`](https://github.com/segmentio/analytics-next/commit/61688e251ad2f60dae4cfd65cf59401c29ec66bd) Thanks [@silesky](https://github.com/silesky)! - Improve core interfaces. Refactor analytics-next to use shared EventQueue, dispatch, and other methods.
  Augment Browser interface with traits and context options type.

### Patch Changes

- [#730](https://github.com/segmentio/analytics-next/pull/730) [`a392bf9`](https://github.com/segmentio/analytics-next/commit/a392bf9ef60cf4a6e6edef0b7c038e993b18b1bd) Thanks [@pooyaj](https://github.com/pooyaj)! - Adding jsdocs for universal storage

* [#743](https://github.com/segmentio/analytics-next/pull/743) [`88c91c8`](https://github.com/segmentio/analytics-next/commit/88c91c8cd56730253b8ac055437823721e450a42) Thanks [@silesky](https://github.com/silesky)! - Remove remote metrics from context and move to stats

- [#742](https://github.com/segmentio/analytics-next/pull/742) [`e29a21a`](https://github.com/segmentio/analytics-next/commit/e29a21adafb44a8810c7534ecde96f03eab0b246) Thanks [@silesky](https://github.com/silesky)! - Fix webdriver.io interception bug. Refactor to use native fetch where unfetch is unavailable.

- Updated dependencies [[`fed489c`](https://github.com/segmentio/analytics-next/commit/fed489cbf2e5b4c0f8423453e24831ec5dcdd7ce), [`61688e2`](https://github.com/segmentio/analytics-next/commit/61688e251ad2f60dae4cfd65cf59401c29ec66bd)]:
  - @segment/analytics-core@1.2.0

## 1.48.0

### Minor Changes

- [#638](https://github.com/segmentio/analytics-next/pull/638) [`e16017d`](https://github.com/segmentio/analytics-next/commit/e16017d4a99a891efebfd87a9f55c03815557a4e) Thanks [@pooyaj](https://github.com/pooyaj)! - Creating universal storage layer and passing it to plugins

### Patch Changes

- [#714](https://github.com/segmentio/analytics-next/pull/714) [`9fc8f43`](https://github.com/segmentio/analytics-next/commit/9fc8f43a77ef3bdcce3e7ef7287c47bd595bca7b) Thanks [@chrisradek](https://github.com/chrisradek)! - Improves Segment.io retries to include exponential backoff and work across page loads.

* [#718](https://github.com/segmentio/analytics-next/pull/718) [`80e0d0a`](https://github.com/segmentio/analytics-next/commit/80e0d0a7d074422654cbebe0c3edb90e1d42ad62) Thanks [@silesky](https://github.com/silesky)! - Refactor inspector to use emitter

- [#713](https://github.com/segmentio/analytics-next/pull/713) [`0d70637`](https://github.com/segmentio/analytics-next/commit/0d7063725cce56e1484bc63a405cecfed847098f) Thanks [@silesky](https://github.com/silesky)! - add logic if plan.integrations is falsy

* [#721](https://github.com/segmentio/analytics-next/pull/721) [`779e66b`](https://github.com/segmentio/analytics-next/commit/779e66b1d5b64af3a632adc0da7642bbdd943d8b) Thanks [@pooyaj](https://github.com/pooyaj)! - Expose universal storage directly on analytics object

* Updated dependencies [[`80e0d0a`](https://github.com/segmentio/analytics-next/commit/80e0d0a7d074422654cbebe0c3edb90e1d42ad62)]:
  - @segment/analytics-core@1.1.6

## 1.47.1

### Patch Changes

- [#710](https://github.com/segmentio/analytics-next/pull/710) [`ef5cd39`](https://github.com/segmentio/analytics-next/commit/ef5cd39ce3a83321f7bf7792c2e68d40ce2be1c6) Thanks [@chrisradek](https://github.com/chrisradek)! - Fixes an issue impacting a small number of destinations where explicitly enabling or disabling an integration on load would not work as expected.

- Updated dependencies [[`90b915a`](https://github.com/segmentio/analytics-next/commit/90b915ac3447d76673e98661c54bf5a0ced2a555), [`108c77e`](https://github.com/segmentio/analytics-next/commit/108c77e81a4e9d2a64eb56e78f707ae6c2ea6ed2)]:
  - @segment/analytics-core@1.1.5

## 1.47.0

### Minor Changes

- [#704](https://github.com/segmentio/analytics-next/pull/704) [`6e42f6e`](https://github.com/segmentio/analytics-next/commit/6e42f6ebdcf05e6c23fc4cacf5634cf6109b785c) Thanks [@pooyaj](https://github.com/pooyaj)! - Emit a `reset` event when analytics.reset() is called

* [#669](https://github.com/segmentio/analytics-next/pull/669) [`b6ae65b`](https://github.com/segmentio/analytics-next/commit/b6ae65b56e2a3ec0e13de79f8d3acf25b7c223d2) Thanks [@zikaari](https://github.com/zikaari)! - Allow use of integrations directly from NPM

### Patch Changes

- Updated dependencies [[`ecb4b8d`](https://github.com/segmentio/analytics-next/commit/ecb4b8db0194e06a3ee3c8cae57d4f327d15dc02)]:
  - @segment/analytics-core@1.1.4

## 1.46.4

### Patch Changes

- Updated dependencies [[`0b9f4d7`](https://github.com/segmentio/analytics-next/commit/0b9f4d7e82662f7d5fda3590e93b10b3fd2e9833)]:
  - @segment/analytics-core@1.1.3

## 1.46.3

### Patch Changes

- [#688](https://github.com/segmentio/analytics-next/pull/688) [`c21734e`](https://github.com/segmentio/analytics-next/commit/c21734eae8fa3ceaaad3d11dd9684a37ce26a19e) Thanks [@arielsilvestri](https://github.com/arielsilvestri)! - Fixes issue where options object would not be properly assigned if properties arg was explicitly undefined

## 1.46.2

### Patch Changes

- [#666](https://github.com/segmentio/analytics-next/pull/666) [`5269a3e`](https://github.com/segmentio/analytics-next/commit/5269a3ea74d7bff7bf143e06a5f857af40f14032) Thanks [@ryder-wendt](https://github.com/ryder-wendt)! - Do not throw errors if localStorage becomes unavailable

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
