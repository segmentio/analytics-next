# Conversion pipeline (UTUA collector)

npm-only integration with the UTUA conversion collector on top of `@segment/analytics-next`, without Segment CDN settings fetch or the `Segment.io` destination.

## Quick start

```ts
import {
  AnalyticsBrowser,
  conversionCdnSettingsMinimal,
  conversionPipelinePlugins,
} from '@segment/analytics-next'

const [analytics] = await AnalyticsBrowser.load(
  {
    writeKey: 'conversion-pipeline',
    cdnSettings: conversionCdnSettingsMinimal,
    plugins: conversionPipelinePlugins({
      endpoint: 'https://your-collector.example/collect',
      appName: 'quiz-static',
    }),
  },
  {
    integrations: { 'Segment.io': false },
    globalAnalyticsKey: 'ConversionAnalytics',
  }
)

await analytics.track('quiz_started', { quizId: 'q1' })
```

## Defaults

| Setting | Default |
|---------|---------|
| `flushIntervalMs` | `2000` |
| `batchSize` | `10` |
| `retryAttempts` | `2` |
| `respectDoNotTrack` | `true` (honours browser DNT) |
| `enableGptSlotEvents` | `false` (set `true` to register GPT slot listeners) |

## Required load options

- **`cdnSettings`**: use `conversionCdnSettingsMinimal` (or equivalent inline settings) so the library does not call the Segment CDN.
- **`integrations: { 'Segment.io': false }`**: disables the Segment.io destination plugin.

## Pipeline plugins (order)

1. **Conversion Consent** — drops events when `isTrackingAllowed()` is false or DNT is set.
2. **Conversion Context** — `session_id`, `app`, `library`, page context, BG `anonymous_id` storage.
3. **Conversion Identify PII** — SHA-256 traits on `identify` (email, phone, name).
4. **Conversion Page Properties** — path taxonomy, query params, `visitor_country` on page/track.
5. **Conversion Collector** — batched `POST` `{ events: [...] }` to your endpoint.
6. **Conversion GPT Slot Events** (optional) — canonical GPT slot `track` events.

Register individual plugins instead of `conversionPipelinePlugins()` if you need a slimmer bundle.

## Collector contract

- **Method:** `POST`
- **Body:** `{ "events": [ /* AnalyticsEventEnvelope */ ] }`
- **Envelope:** `version: 2`, snake_case fields (`anonymous_id`, `event_name`, …)

`alias` and `group` are not sent until the collector supports them.

## Optional settings

```ts
conversionPipelinePlugins({
  endpoint: '/collector',
  appName: 'my-app',
  headers: { 'X-Api-Key': '…' },
  getContext: () => ({ experiment: 'a' }),
  getSessionId: () => customSessionId,
  getVisitorCountry: async () => 'BR',
  defaultPhoneCountryCode: '55',
  isTrackingAllowed: () => consentGranted,
  respectDoNotTrack: true,
  enableGptSlotEvents: false,
})
```

## Snippet / UMD

Use the standard browser UMD build with the same `load` options, or a thin wrapper package (`conversion-analytics-sdk`) in a later release phase.

## Upstream merges

Periodically merge `upstream/master` (segmentio/analytics-next) into your integration branch and resolve conflicts under `packages/browser/`.
