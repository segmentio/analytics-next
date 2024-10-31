# @segment/analytics-signals

## 1.5.0

### Minor Changes

- [#1176](https://github.com/segmentio/analytics-next/pull/1176) [`7d5d9753`](https://github.com/segmentio/analytics-next/commit/7d5d9753509d8af8f10486c91505b30d2c6e240a) Thanks [@silesky](https://github.com/silesky)! - Update max buffer size to 50

* [#1177](https://github.com/segmentio/analytics-next/pull/1177) [`11a943e2`](https://github.com/segmentio/analytics-next/commit/11a943e29e73189c613f93b268e10a64f2561fbc) Thanks [@silesky](https://github.com/silesky)! - - Fix runtime errors for submit
  - Add better form submit data
  - Loosen content-type to parse text/plain
  - Tweak disallow list
  - Add labels

- [#1166](https://github.com/segmentio/analytics-next/pull/1166) [`9e6db285`](https://github.com/segmentio/analytics-next/commit/9e6db2857798f4b5bfdbbfe3570b3d4d83294a79) Thanks [@danieljackins](https://github.com/danieljackins)! - Add sampling logic and block non debug traffic

* [#1168](https://github.com/segmentio/analytics-next/pull/1168) [`ba2f2b16`](https://github.com/segmentio/analytics-next/commit/ba2f2b165bf1b997a9ce79d410690d27d50378fd) Thanks [@silesky](https://github.com/silesky)! - Refactor runtime to use `@segment/analytics-signals-runtime`

### Patch Changes

- [#1178](https://github.com/segmentio/analytics-next/pull/1178) [`08e45530`](https://github.com/segmentio/analytics-next/commit/08e4553001da146f1d80a9b620aef0ef0db04bd4) Thanks [@silesky](https://github.com/silesky)! - \* Refactor disallowList logic to never allow api.segment.io
  - Update README
  - Export SignalsPlugin in umd as well as global
- Updated dependencies [[`ba2f2b16`](https://github.com/segmentio/analytics-next/commit/ba2f2b165bf1b997a9ce79d410690d27d50378fd)]:
  - @segment/analytics-signals-runtime@1.0.0

## 1.4.0

### Minor Changes

- [#1164](https://github.com/segmentio/analytics-next/pull/1164) [`c8ce6144`](https://github.com/segmentio/analytics-next/commit/c8ce6144b31bddfc66961e979d5648fb66e102e5) Thanks [@silesky](https://github.com/silesky)! - Emit network signals that result in errors if the response has been emitted. Add ok and status to network signal data.

* [#1163](https://github.com/segmentio/analytics-next/pull/1163) [`29d17003`](https://github.com/segmentio/analytics-next/commit/29d1700303d0384fbd01edee9e9ff231f35de9ef) Thanks [@silesky](https://github.com/silesky)! - Loosen signal redaction (from https://github.com/segmentio/analytics-next/pull/1106)

## 1.3.0

### Minor Changes

- [#1155](https://github.com/segmentio/analytics-next/pull/1155) [`29e856f9`](https://github.com/segmentio/analytics-next/commit/29e856f9f36088a0dc625014ebda8e09fc3b621e) Thanks [@silesky](https://github.com/silesky)! - - Fix npm installation esm error by vendoring esm-only module workerbox

## 1.2.0

### Minor Changes

- [#1152](https://github.com/segmentio/analytics-next/pull/1152) [`101e8414`](https://github.com/segmentio/analytics-next/commit/101e841404e5f55f53ba014b6195bf1066aeb67e) Thanks [@silesky](https://github.com/silesky)! - - normalize XHR URL, http methods, etc

### Patch Changes

- [#1151](https://github.com/segmentio/analytics-next/pull/1151) [`571386f5`](https://github.com/segmentio/analytics-next/commit/571386f5d388ed3ff44520ee94795424378950ed) Thanks [@silesky](https://github.com/silesky)! - - Clean up up innerText AND textContent artifacts to make easier to parse.
  - Add textContent field
  - Make button Clicks more reliable

## 1.1.0

### Minor Changes

- [#1147](https://github.com/segmentio/analytics-next/pull/1147) [`784ddf21`](https://github.com/segmentio/analytics-next/commit/784ddf21906a2a72c1ccea41d0ba323e189c4010) Thanks [@silesky](https://github.com/silesky)! - Update network signals to add support for allow/disallow

### Patch Changes

- [#1150](https://github.com/segmentio/analytics-next/pull/1150) [`04a7cc85`](https://github.com/segmentio/analytics-next/commit/04a7cc85247bdcdb832d0cca4ddbb4391ccada3a) Thanks [@silesky](https://github.com/silesky)! - Support XHR interception

## 1.0.1

### Patch Changes

- [#1140](https://github.com/segmentio/analytics-next/pull/1140) [`549b028`](https://github.com/segmentio/analytics-next/commit/549b02898dd7c0541957659da8c56e93129507df) Thanks [@silesky](https://github.com/silesky)! - Make network signals more permissive

## 1.0.0

### Major Changes

- [#1132](https://github.com/segmentio/analytics-next/pull/1132) [`17432de`](https://github.com/segmentio/analytics-next/commit/17432de7b09d543c29f12c48ea61edf73aa7f4a1) Thanks [@silesky](https://github.com/silesky)! - Update signal request/response to lowercase.

## 0.1.1

### Patch Changes

- [#1116](https://github.com/segmentio/analytics-next/pull/1116) [`0fdf170`](https://github.com/segmentio/analytics-next/commit/0fdf1704af80c168113733beac3ef4eedeab6d2b) Thanks [@silesky](https://github.com/silesky)! - Process signals that occur before analytics init

## 0.1.0

### Minor Changes

- [#1110](https://github.com/segmentio/analytics-next/pull/1110) [`8d06af2`](https://github.com/segmentio/analytics-next/commit/8d06af29658b579e347ee8dbe39d6f62f01eab05) Thanks [@silesky](https://github.com/silesky)! - Add enums

### Patch Changes

- [#1113](https://github.com/segmentio/analytics-next/pull/1113) [`2d89b1d`](https://github.com/segmentio/analytics-next/commit/2d89b1db2413d5c38f6fdb4832d111cd9141a51e) Thanks [@silesky](https://github.com/silesky)! - Update network signals to include a full url

* [#1115](https://github.com/segmentio/analytics-next/pull/1115) [`73ac593`](https://github.com/segmentio/analytics-next/commit/73ac593226159423b2f63cac190eebd347bbb75a) Thanks [@silesky](https://github.com/silesky)! - Fix group and identify calls.

- [#1112](https://github.com/segmentio/analytics-next/pull/1112) [`1f68f0e`](https://github.com/segmentio/analytics-next/commit/1f68f0e3309e291fb37f3732d8c32bd55f526633) Thanks [@silesky](https://github.com/silesky)! - Allow collecting signals from sources without an edge function written yet

## 0.0.1

### Patch Changes

- [#1101](https://github.com/segmentio/analytics-next/pull/1101) [`aee18d2`](https://github.com/segmentio/analytics-next/commit/aee18d222ddfb2273399987fabf92b54876f5e88) Thanks [@silesky](https://github.com/silesky)! - Initial release.
