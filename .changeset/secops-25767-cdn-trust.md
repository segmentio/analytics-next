---
'@segment/analytics-next': patch
---

Harden CDN and write-key resolution (SECOPS-25767).

Previously the SDK determined which origin to trust for its settings by
scanning every `<script>` tag in the document and accepting a match on URL
shape alone, with no proof the tag had loaded the SDK and no origin check.
Because the shape is attacker-controlled, anyone able to inject markup into the
page - but not to execute script - could add a Segment-shaped `<script src>` on
their own origin and redirect the settings fetch, and transitively remote-plugin
script loading, to that origin. The tag did not need to execute: one inserted
via `innerHTML` is never run by the browser, but it is in the DOM and was still
read.

CDN resolution is now, in order:

1. an explicitly configured `cdnURL` / `window.analytics._cdn`
2. the tag that actually loaded the SDK (`document.currentScript`, snapshotted at
   boot so it also works from the CSP fallback handler, the polyfill `onload`,
   and deferred `.load()` calls)
3. a tag whose derived CDN base is exactly one of our own origins
   (`https://cdn.segment.com`, `https://cdn.segment.build`)
4. otherwise the default `https://cdn.segment.com`

The write key is read from that same trusted source, after the existing embedded
write key and `window.analytics._writeKey`. It no longer falls back to scanning
the DOM, so a page with no trusted tag yields no write key rather than a sniffed
one.

Proxy and self-hosted CDN setups continue to work: the proxy tag is the tag that
loads the SDK, so it is trusted via (2), including first-party CDNs on a
different registrable domain than the page. Setups where the SDK is loaded by a
bundler alongside a snippet on a non-Segment CDN no longer auto-detect that CDN
and should set `cdnURL` explicitly.
