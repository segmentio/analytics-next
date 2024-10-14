/* eslint-disable */
// Generated in: @segment/analytics-signals-runtime@0.0.0
// Entry point: ./src/mobile/index.signals-runtime.ts
export const RuntimeString = `
"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/mobile/mobile-constants.ts
  var mobile_constants_exports = {};
  __export(mobile_constants_exports, {
    EventType: () => EventType,
    LocalDataAction: () => LocalDataAction,
    NavigationAction: () => NavigationAction,
    NetworkAction: () => NetworkAction,
    SignalType: () => SignalType
  });
  var SignalType = Object.freeze({
    Interaction: "interaction",
    Navigation: "navigation",
    Network: "network",
    LocalData: "localData",
    Instrumentation: "instrumentation",
    UserDefined: "userDefined"
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
    Forward: "forward",
    Backward: "backward",
    Modal: "modal",
    Entering: "entering",
    Leaving: "leaving",
    Page: "page",
    Popup: "popup"
  });
  var NetworkAction = Object.freeze({
    Request: "request",
    Response: "response"
  });
  var LocalDataAction = Object.freeze({
    Loaded: "loaded",
    Updated: "updated",
    Saved: "saved",
    Deleted: "deleted",
    Undefined: "undefined"
  });

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

  // src/mobile/mobile-signals-runtime.ts
  var Signals = class extends SignalsRuntime {
    constructor(signals = []) {
      super(signals);
      // mobile only
      this.add = (signal) => {
        if (this.signalCounter < 0) {
          this.signalCounter = 0;
        }
        if ("index" in signal && signal.index == -1) {
          signal.index = this.getNextIndex();
        }
        this.signalBuffer.unshift(signal);
        if (this.signalBuffer.length > this.maxBufferSize) {
          this.signalBuffer.pop();
        }
      };
      // mobile only
      this.getNextIndex = () => {
        const index = this.signalCounter;
        this.signalCounter += 1;
        return index;
      };
      this.signalCounter = 0;
      this.maxBufferSize = 1e3;
    }
  };

  // src/mobile/index.signals-runtime.ts
  Object.assign(
    globalThis,
    {
      Signals
    },
    mobile_constants_exports
  );
})();
`