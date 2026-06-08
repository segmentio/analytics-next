# Architecture — Conversion Analytics SDK

**Status:** Alinhado à implementação  
**Última revisão:** 2026-06-08  
**Substitui:** `architecture_lib_analytics.md` (planejamento com contrato Segment nativo)

## Visão geral

```
[LP Browser]
    │
    ├── ConversionAnalytics.init({ endpoint, appName, ... })
    │   └── AnalyticsBrowser.load() → plugins → auto page
    │
    ├── ConversionAnalytics.track('impression', { block_id, block_position })
    │   │
    │   ▼ Pipeline analytics-next: before → enrichment → destination
    │   │
    │   ├── [env-enrichment] (built-in, before)
    │   │   └── context.page, context.campaign (Segment nativo — complementar)
    │   │
    │   ├── [Conversion Consent] (before)
    │   │   └── Drop se isTrackingAllowed() === false ou DNT
    │   │
    │   ├── [Conversion Context] (before)
    │   │   ├── session_id (cookie + TTL 5min)
    │   │   ├── anonymous_id (localStorage)
    │   │   └── page context (url, path, referrer, UA, etc.)
    │   │
    │   ├── [Conversion Identify PII] (before)
    │   │   └── SHA-256 em email/phone antes do envio
    │   │
    │   ├── [Conversion Page Properties] (before)
    │   │   ├── query_params + UTMs + click-ids → properties
    │   │   └── page taxonomy (country, vertical, product, funnel)
    │   │
    │   └── [Conversion Collector] (destination)
    │       ├── contextToEnvelope() → envelope v2
    │       ├── BatchBuffer (size + interval + localStorage persist)
    │       ├── fetch POST { events: [...] }
    │       ├── retry com backoff (3 tentativas max)
    │       └── visibilitychange/pagehide → sendBeacon
    │
    ▼
[POST /collector] → Collector normalize() → ClickHouse + Redis
```

## Decisões arquiteturais

### Base: analytics-next fork

- Monorepo em `analytics-next/` (Yarn 3 + Turborepo)
- SDK produto: `packages/browser/src/conversion-sdk/` + `plugins/conversion-collector/`
- Build: `webpack.conversion-sdk.config.js` → `dist/umd/sdk.min.js`
- `AnalyticsBrowser.load()` com `integrations: { 'Segment.io': false }` — sem destination Segment

### Contrato de payload (decisão v2)

O SDK **não** envia o array nativo analytics-next. Transforma cada evento em
`AnalyticsEventEnvelope` (version 2, snake_case) e envia `{ events: [...] }`.

**Justificativa:** contrato explícito com o Collector UTUA, campos dedicados para atribuição
em `properties`, compatível com envelope Segment mas com paths estáveis para `normalize()`.

Ver [backend-contract.md](./backend-contract.md) para spec completa.

### Session storage

| Dado | Storage | Key / Cookie |
|------|---------|--------------|
| `session_id` | Cookie | `__bg_analytics_session_id` |
| `last_activity` | Cookie | `__bg_analytics_session_activity` |
| `anonymous_id` | localStorage | `__bg_analytics_anonymous_id` |
| `query_params` (sessão) | sessionStorage | `__bg_analytics_query_params` |
| Fila de eventos | localStorage | `utua_event_queue` |

- **TTL inatividade:** 5 minutos (`SESSION_INACTIVITY_TTL_MS`)
- **Cookie flags:** `SameSite=Lax`, `Secure` (HTTPS), `path=/`
- **Verificação de expiração:** a cada event handler (sem timer)

### Transport & delivery

| Cenário | Transporte |
|---------|------------|
| Flush normal | `fetch` POST |
| Unload (hidden/pagehide) | `navigator.sendBeacon` com `Blob` JSON |
| Beacon falha ou payload > 64KB | `fetch` com `keepalive: true` |

**Retry:** base 1s, fator 2, max 30s, jitter 0–1000ms, max 3 tentativas por batch.

| HTTP status | Comportamento |
|-------------|---------------|
| 2xx | Sucesso |
| 429 | Retry (lê `Retry-After`) |
| 5xx | Retry |
| 4xx (exceto 429) | Descarta batch (payload inválido) |

Após esgotar retries, eventos voltam para fila persistida em localStorage.

**Limites da fila persistida:** 100 eventos ou 1 MB (o que vier primeiro).

### Plugin boundaries

| Plugin | Tipo | Modifica evento? | Acessa rede? |
|--------|------|------------------|--------------|
| Conversion Consent | before | Cancela | Não |
| Conversion Context | before | `context.*` | Não |
| Conversion Identify PII | before | `traits` | Não |
| Conversion Page Properties | before | `properties` | Não |
| Conversion Collector | destination | Não (envelope na entrega) | Sim |
| Conversion GPT Slot Events | utility | `track` automático | Não |

Erros em destination são capturados internamente (não propagam). Erros em enrichment
de session propagam — melhor falhar que enviar sem `session_id`.

### Entry point

```
browser-entry.ts
  └── bootstrapConversionAnalyticsFromWindow()
        ├── lê stub _ConversionAnalytics / ConversionAnalytics
        ├── ConversionAnalyticsBrowser.load(config)
        ├── hidrata window.ConversionAnalytics
        ├── replay queue do stub
        └── auto page() se host não enfileirou page
```

## Estrutura de código

```
packages/browser/src/
├── conversion-sdk/
│   ├── index.ts                 # API pública
│   ├── browser-entry.ts         # UMD entry (auto-bootstrap)
│   ├── bootstrap.ts             # Stub hydration
│   ├── config.ts                # Defaults
│   ├── conversion-client.ts     # AnalyticsBrowser.load + plugins
│   ├── conversion-analytics-browser.ts
│   ├── singleton.ts
│   └── types.ts
└── plugins/conversion-collector/
    ├── index.ts
    ├── pipeline-plugins.ts
    ├── destination-plugin.ts
    ├── batch-buffer.ts
    ├── send-events.ts
    ├── context-to-envelope.ts
    ├── enrichment/
    │   ├── consent-enrichment.ts
    │   ├── context-enrichment.ts
    │   ├── identify-enrichment.ts
    │   └── page-enrichment.ts
    └── lib/
        ├── session.ts
        ├── resolve-context.ts
        ├── query-params.ts
        ├── page-properties.ts
        ├── page-taxonomy.ts
        └── event-queue-storage.ts
```

## Deploy

- **Same-domain obrigatório:** script + endpoint no mesmo origin
- **Distribuição:** arquivo estático (`sdk.min.js`), sem npm público
- **Endpoint default:** `/collector` (configurável)
- Ver [../DISTRIBUTING-STATIC-SDK.md](../DISTRIBUTING-STATIC-SDK.md)

## Testes

| Tipo | Localização | Cobertura |
|------|-------------|-----------|
| Unitário | `plugins/conversion-collector/**/__tests__/` | session, fila, send-events, parity |
| Unitário | `conversion-sdk/__tests__/` | bootstrap, globals |
| Integração | `parity.integration.test.ts` | pipeline end-to-end com mock fetch |
| E2E Playwright | — | ⚠️ Planejado (flush on unload, offline, LP real) |

## Divergências vs planejamento original

| Planejamento original | Implementação atual |
|-----------------------|---------------------|
| `window.analytics.init(writeKey)` | `ConversionAnalytics.init(config)` |
| `context.sessionId` (camelCase) | `context.session_id` (snake_case) |
| UTMs em `context.campaign.*` | UTMs em `properties` + `query_params` |
| POST `/collect` array nativo | POST `/collector` com `{ events: [...] }` |
| 2 plugins (session + collector) | 5 plugins (+ GPT opcional) |
| `packages/sdk/` no monorepo pipeline | Embutido no fork analytics-next |

Estas divergências são **intencionais** e documentadas. O Collector deve implementar
`normalize()` conforme [backend-contract.md](./backend-contract.md).

## Phase 2 (deferred)

- Configuration Server dinâmico
- `globalName` configurável
- Consent management plugin (LGPD/GDPR)
