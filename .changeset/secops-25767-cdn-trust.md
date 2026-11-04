---
'@segment/analytics-next': minor
---

Harden CDN and write-key resolution (SECOPS-25767).

**Behavior change — read this if you proxy or self-host the SDK.** The SDK no
longer discovers its CDN or write key by scanning arbitrary `<script>` tags in
the page. Two configurations that previously worked by auto-detection now need
explicit configuration:

1. **SDK loaded by a bundler alongside a snippet on a non-Segment CDN.** The
   snippet's CDN is no longer auto-detected; resolution falls back to
   `https://cdn.segment.com`. Pass `cdnURL` explicitly:
   `AnalyticsBrowser.load({ writeKey, cdnURL: 'https://your.cdn' })`. Note that
   if your CSP allowlists only your own CDN, the settings request to
   `cdn.segment.com` will be blocked and analytics will fail to initialize -
   this does not degrade silently.
2. **Pages relying on the write key being sniffed out of the DOM.**
   `getWriteKey()` no longer scans; it reads the embedded write key,
   `window.analytics._writeKey`, then the tag that loaded the SDK. A page with
   none of those now yields no write key and analytics will not initialize.
   Snippet versions 4.15.3 and later set `_writeKey` and are unaffected.

Standard snippet installations, and proxy or self-hosted setups where the SDK is
loaded from the proxy's own tag, are unaffected - including first-party CDNs on
a different registrable domain than the page.

**Why.** The SDK previously determined which origin to trust for its settings by
scanning every `<script>` tag in the document and accepting a match on URL shape
alone, with no proof the tag had loaded the SDK and no origin check. Because the
shape is attacker-controlled, anyone able to inject markup into the page - but
not to execute script - could add a Segment-shaped `<script src>` on their own
origin and redirect the settings fetch, and transitively remote-plugin script
loading, to that origin. The tag did not need to execute: one inserted via
`innerHTML` is never run by the browser, but it is in the DOM and was still read.

**What it does now.** CDN resolution, in order:

1. an explicitly configured `cdnURL` / `window.analytics._cdn`
2. the tag that actually loaded the SDK (`document.currentScript`, snapshotted at
   boot so it also works from the CSP fallback handler, the polyfill `onload`,
   and deferred `.load()` calls)
3. a tag whose derived CDN base is exactly one of our own origins
   (`https://cdn.segment.com`, `https://cdn.segment.build`)
4. otherwise the default `https://cdn.segment.com`

The write key is read from that same trusted source, after the existing embedded
write key and `window.analytics._writeKey`.
