/**
 * QuizBuilder integration (script snippet).
 *
 * This file is intentionally "not runnable TS" – it documents the expected
 * integration shape used in pages that can't import modules.
 *
 * Host `packages/browser/dist/umd/sdk.min.js` on the same domain as `/collect` and load it with the stub below.
 */

export const snippet = String.raw`<script async>
  !function(e,t,r,n,o,a){if(!e[o]){var c=e[o]=function(){c.queue.push({type:arguments[0],arguments:Array.prototype.slice.call(arguments).slice(1)})};c.queue=[],c.push=c,c.track=function(){c.queue.push({type:"track",arguments:Array.prototype.slice.call(arguments)})},c.identify=function(){c.queue.push({type:"identify",arguments:Array.prototype.slice.call(arguments)})},c.page=function(){c.queue.push({type:"page",arguments:Array.prototype.slice.call(arguments)})},c.config={
    endpoint: "https://conversion-pipeline-collector.stg.utua.work/v1/conversion/collect",
    appName: "quizbuilder-frontend",
    debug: false
  },c.version="1.0",c.loaded=!0,e["_"+o]||(e["_"+o]=c),c.start=function(){var e=t.createElement(r);e.src="/assets/sdk.min.js",e.async=!0;var n=t.getElementsByTagName(r)[0];n.parentNode.insertBefore(e,n)}}}(window,document,"script",0,"ConversionAnalytics");

  // Load real SDK
  window.ConversionAnalytics.start();

  // Optional: identify early (example matches your PrivateParams flow)
  if (window.PrivateParams && window.PrivateParams["an_uid"] && window.ConversionAnalytics) {
    window.ConversionAnalytics.identify(window.PrivateParams["an_uid"]);
  }

  // Example events
  window.ConversionAnalytics.page();
  window.ConversionAnalytics.track("quiz_builder_loaded", { page: "builder", version: "v1" });
</script>`;
