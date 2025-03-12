# @segment/analytics-signals

## 1.11.1

### Patch Changes

- [#1246](https://github.com/segmentio/analytics-next/pull/1246) [`ee838db5`](https://github.com/segmentio/analytics-next/commit/ee838db5b361fc52a400ab2fb8bae50bff4d262b) Thanks [@silesky](https://github.com/silesky)! - Fix argument resolver bug where the following would not set the correct options:
  ```ts
  analytics.page(
     null,
     'foo',
     { url: "https://foo.com" },
     { context: { __eventOrigin: { type: 'Signal' } } // would not be set correctly
  )
  ```
- Updated dependencies [[`d5829da8`](https://github.com/segmentio/analytics-next/commit/d5829da8ce6a1664d9be2e00960791d929ee73bc)]:
  - @segment/analytics-signals-runtime@1.4.0

## 1.11.0

### Minor Changes

- [#1238](https://github.com/segmentio/analytics-next/pull/1238) [`0596bc45`](https://github.com/segmentio/analytics-next/commit/0596bc455b9ecf8ed179f1be5decb0a4b89bb9a5) Thanks [@silesky](https://github.com/silesky)! - Add page data to web signals

### Patch Changes

- Updated dependencies [[`0596bc45`](https://github.com/segmentio/analytics-next/commit/0596bc455b9ecf8ed179f1be5decb0a4b89bb9a5)]:
  - @segment/analytics-signals-runtime@1.3.0

## 1.10.3

### Patch Changes

- [#1233](https://github.com/segmentio/analytics-next/pull/1233) [`9b470331`](https://github.com/segmentio/analytics-next/commit/9b470331584e02dd883942ae83300c9eb971bc95) Thanks [@silesky](https://github.com/silesky)! - Fix max buffer size

* [#1232](https://github.com/segmentio/analytics-next/pull/1232) [`91dab927`](https://github.com/segmentio/analytics-next/commit/91dab9273954bc26dbcb579a387787f5a0cc185e) Thanks [@silesky](https://github.com/silesky)! - Fix circular submit error for react-hook-form

## 1.10.2

### Patch Changes

- [#1230](https://github.com/segmentio/analytics-next/pull/1230) [`2fc749a1`](https://github.com/segmentio/analytics-next/commit/2fc749a17b14b2667df76ecce685aefb6656eaae) Thanks [@silesky](https://github.com/silesky)! - Update license key

- Updated dependencies [[`2fc749a1`](https://github.com/segmentio/analytics-next/commit/2fc749a17b14b2667df76ecce685aefb6656eaae)]:
  - @segment/analytics-signals-runtime@1.2.1

## 1.10.1

### Patch Changes

- [#1226](https://github.com/segmentio/analytics-next/pull/1226) [`e0ed6a5a`](https://github.com/segmentio/analytics-next/commit/e0ed6a5a072bcb859a2ae304e572e03284d262de) Thanks [@silesky](https://github.com/silesky)! - Testing CI

## 1.10.0

### Minor Changes

- [#1220](https://github.com/segmentio/analytics-next/pull/1220) [`bf868573`](https://github.com/segmentio/analytics-next/commit/bf8685737466cb1193a54f99871ec7348b8616d8) Thanks [@silesky](https://github.com/silesky)! - Allow registration of middleware to allow for dropping and modification of signals

  ```ts
  class MyMiddleware implements SignalsMiddleware {
    process(signal: Signal) {
      if (
        signal.type === 'network' &&
        signal.data.action === 'request' &&
        ...
      ) {
        // drop or modify signal
        return null
      } else {
        return signal
      }
    }
  }
  const signalsPlugin = new SignalsPlugin({
    middleware: [new MyMiddleware()]
  })
  ```

### Patch Changes

- [#1224](https://github.com/segmentio/analytics-next/pull/1224) [`171080cc`](https://github.com/segmentio/analytics-next/commit/171080cc9ca198b9f89a9e9154c2a78ed8ef29ee) Thanks [@silesky](https://github.com/silesky)! - Refactor to use SignalEmitter middleware + subscriber interface internally

## 1.9.2

### Patch Changes

- [#1215](https://github.com/segmentio/analytics-next/pull/1215) [`9a8b0e03`](https://github.com/segmentio/analytics-next/commit/9a8b0e0322a4291a3ee3c5c06974a0af9ea5469f) Thanks [@silesky](https://github.com/silesky)! - Fix bug where in vanilla React environments, the onChange events would error due to circular references.

## 1.9.1

### Patch Changes

- [#1204](https://github.com/segmentio/analytics-next/pull/1204) [`8e0162b9`](https://github.com/segmentio/analytics-next/commit/8e0162b9553419448b7975337a53fa1c66e70d47) Thanks [@silesky](https://github.com/silesky)! - Update types

## 1.9.0

### Minor Changes

- [#1202](https://github.com/segmentio/analytics-next/pull/1202) [`00a736f3`](https://github.com/segmentio/analytics-next/commit/00a736f31326328e91c9cae0b244b9db9b0791fc) Thanks [@silesky](https://github.com/silesky)! - - Add support for interaction signals for custom components and elements with contenteditable property
  - Allow custom disallow list to override network signals, even if same domain.

### Patch Changes

- Updated dependencies [[`00a736f3`](https://github.com/segmentio/analytics-next/commit/00a736f31326328e91c9cae0b244b9db9b0791fc)]:
  - @segment/analytics-signals-runtime@1.2.0

## 1.8.0

### Minor Changes

- [#1190](https://github.com/segmentio/analytics-next/pull/1190) [`46e88198`](https://github.com/segmentio/analytics-next/commit/46e88198b2f9d3a835e02fa22317d784c6f71ebf) Thanks [@silesky](https://github.com/silesky)! - \* Clear signal buffer at start of new session
  - Prune signalBuffer to maxBufferSize on new session (if different)
  - Add sessionStorage storage type

### Patch Changes

- [#1192](https://github.com/segmentio/analytics-next/pull/1192) [`3410160c`](https://github.com/segmentio/analytics-next/commit/3410160c30024c292f252802cdb98b6b59fced0c) Thanks [@silesky](https://github.com/silesky)! - Always include headers in network interceptor, even if empty

* [#1188](https://github.com/segmentio/analytics-next/pull/1188) [`de6f86dc`](https://github.com/segmentio/analytics-next/commit/de6f86dc637dbc49f5bb55c1e44a36a2011c14b9) Thanks [@danieljackins](https://github.com/danieljackins)! - Fix sampleRate check

- [#1197](https://github.com/segmentio/analytics-next/pull/1197) [`342868cb`](https://github.com/segmentio/analytics-next/commit/342868cb9db7da37d8851dadca4b1b1dc0ecd923) Thanks [@silesky](https://github.com/silesky)! - Update signals license

- Updated dependencies [[`342868cb`](https://github.com/segmentio/analytics-next/commit/342868cb9db7da37d8851dadca4b1b1dc0ecd923)]:
  - @segment/analytics-signals-runtime@1.1.1

## 1.7.1

### Patch Changes

- [#1186](https://github.com/segmentio/analytics-next/pull/1186) [`bf85047e`](https://github.com/segmentio/analytics-next/commit/bf85047e971add497d5c9ab72972394b1f27e887) Thanks [@silesky](https://github.com/silesky)! - Add signals logging for events

## 1.7.0

### Minor Changes

- [#1183](https://github.com/segmentio/analytics-next/pull/1183) [`f50bd0f5`](https://github.com/segmentio/analytics-next/commit/f50bd0f5fc30840af33992107cb0a5da432a0b1b) Thanks [@silesky](https://github.com/silesky)! - add support for analytics.reset()

* [#1184](https://github.com/segmentio/analytics-next/pull/1184) [`ccc97f1b`](https://github.com/segmentio/analytics-next/commit/ccc97f1b61f90c6e07154e205d79952fc579fae1) Thanks [@silesky](https://github.com/silesky)! - Update logging

## 1.6.0

### Minor Changes

- [#1181](https://github.com/segmentio/analytics-next/pull/1181) [`6fff4114`](https://github.com/segmentio/analytics-next/commit/6fff4114fb2cc9267362d8a3812ad96ec85a1dac) Thanks [@silesky](https://github.com/silesky)! - Add HTTPMethods. Do not gate requests based on content-type.

### Patch Changes

- Updated dependencies [[`6fff4114`](https://github.com/segmentio/analytics-next/commit/6fff4114fb2cc9267362d8a3812ad96ec85a1dac)]:
  - @segment/analytics-signals-runtime@1.1.0

## 1.5.1

### Patch Changes

- [#1179](https://github.com/segmentio/analytics-next/pull/1179) [`ed7a749b`](https://github.com/segmentio/analytics-next/commit/ed7a749be7cddcbf656ac9f72e444ea9f822a718) Thanks [@silesky](https://github.com/silesky)! - Redact formData

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
