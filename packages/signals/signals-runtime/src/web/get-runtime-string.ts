/* eslint-disable */
// Generated in: @segment/analytics-signals-runtime@0.0.0
// Entry point: ./src/web/index.signals-runtime.ts
export const RuntimeString = `
"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/shared/signals-runtime.ts
  var SignalsRuntime = class {
    constructor(signals = []) {
      this.find = (fromSignal, signalType, predicate) => {
        return this.filter(fromSignal, signalType, predicate)[0];
      };
      this.filter = (fromSignal, signalType, predicate) => {
        const _isSignalOfType = (signal) => signal.type === signalType;
        return this.signalBuffer.slice(this.signalBuffer.indexOf(fromSignal) + 1).filter(_isSignalOfType).filter((signal) => predicate ? predicate(signal) : () => true);
      };
      this.signalBuffer = signals;
    }
  };

  // src/web/web-signals-runtime.ts
  var Signals = class extends SignalsRuntime {
  };

  // src/web/web-constants.ts
  var web_constants_exports = {};
  __export(web_constants_exports, {
    EventType: () => EventType,
    NavigationAction: () => NavigationAction,
    SignalType: () => SignalType
  });
  var EventType = Object.freeze({
    Track: "track",
    Page: "page",
    Screen: "screen",
    Identify: "identify",
    Group: "group",
    Alias: "alias"
  });
  var NavigationAction = Object.freeze({
    URLChange: "urlChange",
    PageLoad: "pageLoad"
  });
  var SignalType = Object.freeze({
    Interaction: "interaction",
    Navigation: "navigation",
    Network: "network",
    LocalData: "localData",
    Instrumentation: "instrumentation",
    UserDefined: "userDefined"
  });

  // src/web/index.signals-runtime.ts
  Object.assign(
    globalThis,
    {
      Signals
    },
    web_constants_exports
  );
})();
`