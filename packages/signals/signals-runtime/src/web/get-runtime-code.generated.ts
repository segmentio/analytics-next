/* eslint-disable */
// GENERATED, DO NOT EDIT
// Entry point: src/web/index.signals-runtime.ts
export const getRuntimeCode = (): string => `
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
(function () {
  var o = Object.defineProperty;
  var S = function S(l, e) {
    for (var n in e) o(l, n, {
      get: e[n],
      enumerable: !0
    });
  };
  var i = /*#__PURE__*/_createClass(function i() {
    var _this = this;
    var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    _classCallCheck(this, i);
    this.find = function (e, n, a) {
      return _this.filter(e, n, a)[0];
    };
    this.filter = function (e, n, a) {
      var s = function s(g) {
        return g.type === n;
      };
      return _this.signalBuffer.slice(_this.signalBuffer.indexOf(e) + 1).filter(s).filter(function (g) {
        return a ? a(g) : function () {
          return !0;
        };
      });
    };
    this.signalBuffer = e;
  });
  var t = /*#__PURE__*/function (_i) {
    _inherits(t, _i);
    var _super = _createSuper(t);
    function t() {
      _classCallCheck(this, t);
      return _super.apply(this, arguments);
    }
    return _createClass(t);
  }(i);
  var r = {};
  S(r, {
    EventType: function EventType() {
      return f;
    },
    NavigationAction: function NavigationAction() {
      return p;
    },
    SignalType: function SignalType() {
      return y;
    }
  });
  var f = Object.freeze({
      Track: "track",
      Page: "page",
      Screen: "screen",
      Identify: "identify",
      Group: "group",
      Alias: "alias"
    }),
    p = Object.freeze({
      URLChange: "urlChange",
      PageLoad: "pageLoad"
    }),
    y = Object.freeze({
      Interaction: "interaction",
      Navigation: "navigation",
      Network: "network",
      LocalData: "localData",
      Instrumentation: "instrumentation",
      UserDefined: "userDefined"
    });
  Object.assign(globalThis, {
    signals: new t()
  }, r);
})();
`
  