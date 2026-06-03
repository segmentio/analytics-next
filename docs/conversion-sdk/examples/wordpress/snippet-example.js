/*
  WordPress / landing page integration (script snippet).
  Paste this into the page (or a tag manager) and host `packages/browser/dist/umd/sdk.min.js`
  on the same domain as the collector endpoint.
*/

/* eslint-disable */
(function (e, t, r, o, a) {
  if (!e[a]) {
    var c = (e[a] = function () {
      c.queue.push({ type: arguments[0], arguments: Array.prototype.slice.call(arguments, 1) });
    });
    c.queue = [];
    c.track = function () {
      c.queue.push({ type: "track", arguments: Array.prototype.slice.call(arguments) });
    };
    c.identify = function () {
      c.queue.push({ type: "identify", arguments: Array.prototype.slice.call(arguments) });
    };
    c.page = function () {
      c.queue.push({ type: "page", arguments: Array.prototype.slice.call(arguments) });
    };
    c.config = {
      endpoint: "https://conversion-pipeline-collector.stg.utua.work/v1/conversion/collect",
      appName: "wordpress-landing-page",
      debug: false,
    };
    c.version = "1.0";
    c.loaded = true;
    e["_" + a] || (e["_" + a] = c);
    c.start = function () {
      var s = t.createElement(r);
      s.src = "/assets/sdk.min.js";
      s.async = true;
      var n = t.getElementsByTagName(r)[0];
      n.parentNode.insertBefore(s, n);
    };
  }
})(window, document, "script", 0, "ConversionAnalytics");

window.ConversionAnalytics.start();
window.ConversionAnalytics.page();
window.ConversionAnalytics.track("wp_page_view", { template: "quiz-landing" });
