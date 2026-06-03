# Conversion pipeline (UTUA collector)

Browser SDK for the UTUA conversion collector — **static script tag only** (same-domain).
Built on the analytics-next fork with custom `conversion-collector` plugins; no Segment CDN or `Segment.io` destination.

## Quick start (2 lines)

Host `sdk.min.js` on the same domain as `/collect`:

```html
<script src="/assets/sdk.min.js"></script>
<script>
  ConversionAnalytics.init({
    endpoint: '/collect',
    appName: 'my-landing-page',
  });
</script>
```

The IIFE auto-bootstraps `window.ConversionAnalytics`, replays stub queue calls, and sends an initial `page` event unless the host queued one.

## Stub snippet (load async, queue early events)

Use this pattern when the script loads after inline calls:

```html
<script async>
!function(e,t,r,n,o,a){if(!e[o]){var c=e[o]=function(){c.queue.push({type:arguments[0],arguments:Array.prototype.slice.call(arguments).slice(1)})};c.queue=[],c.track=function(){c.queue.push({type:"track",arguments:Array.prototype.slice.call(arguments)})},c.identify=function(){c.queue.push({type:"identify",arguments:Array.prototype.slice.call(arguments)})},c.page=function(){c.queue.push({type:"page",arguments:Array.prototype.slice.call(arguments)})},c.config={endpoint:"/collect",appName:"my-lp"},c.version="1.0",c.loaded=!0,e["_"+o]||(e["_"+o]=c),c.start=function(){var e=t.createElement(r);e.src="/assets/sdk.min.js",e.async=!0;var n=t.getElementsByTagName(r)[0];n.parentNode.insertBefore(e,n)}}}(window,document,"script",0,"ConversionAnalytics");
ConversionAnalytics.start();
</script>
```

Swap `/assets/sdk.min.js` for your CDN path or a GitHub Pages URL from `script/sdk.min.js` after build.

## Build artifacts

After `yarn build:conversion-sdk` in `packages/browser`:

| File | Use |
|------|-----|
| `dist/umd/sdk.min.js` | Production — deploy to LP |
| `dist/umd/conversion-analytics.build.js` | Debug (readable) |
| `script/sdk.min.js` | Versioned mirror in repo (see [DISTRIBUTING-STATIC-SDK.md](./DISTRIBUTING-STATIC-SDK.md)) |

## Instrumentation

```javascript
ConversionAnalytics.track('impression', {
  block_id: 'top_father',
  block_position: 1,
});

ConversionAnalytics.track('ad_request', {
  block_id: 'top_father',
  ad_request_id: 'req_abc123',
});

ConversionAnalytics.identify('user-id', { email: 'user@example.com' });
```

Global API: `window.ConversionAnalytics` — methods `init`, `track`, `page`, `identify`, `flush`, `getDebugInfo`, `getQueueSize`.

## Init options

| Option | Default | Description |
|--------|---------|-------------|
| `endpoint` | `/collector` | Collector POST URL (same origin recommended) |
| `appName` | — | App name in event context |
| `debug` | `false` | On-page debug panel |
| `flushIntervalMs` | `2000` | Batch flush interval |
| `batchSize` | `10` | Events per batch |
| `retryAttempts` | `2` | Network retries per batch |
| `isTrackingAllowed` | — | Consent hook; return `false` to drop events |
| `respectDoNotTrack` | `false` | Honor browser DNT |
| `enableGptSlotEvents` | `true` | GPT slot listeners |

## Pipeline (internal)

1. **Conversion Consent** — drops events when tracking not allowed
2. **Conversion Context** — `session_id`, anonymous id, page context
3. **Conversion Identify PII** — SHA-256 on email/phone
4. **Conversion Page Properties** — UTMs, click IDs, path taxonomy
5. **Conversion Collector** — batched `POST` `{ events: [...] }`
6. **Conversion GPT Slot Events** (optional)

## Collector contract

- **Method:** `POST`
- **Body:** `{ "events": [ /* AnalyticsEventEnvelope */ ] }`
- **Envelope:** `version: 2`, snake_case fields

See [conversion-sdk/backend-contract.md](./conversion-sdk/backend-contract.md).

## Docs

- [Static distribution / CI](./DISTRIBUTING-STATIC-SDK.md)
- [Backend contract](./conversion-sdk/backend-contract.md)
- [Page taxonomy](./conversion-sdk/page-taxonomy.md)
- [PII and consent](./conversion-sdk/pii-and-consent.md)
- [Examples](./conversion-sdk/examples/)

## Bundle size

`sdk.min.js` is ~38 KB gzip today (target ≤ 30 KB tracked separately).

## Upstream merges

Merge `upstream/master` (segmentio/analytics-next) periodically; resolve conflicts under `packages/browser/`.
