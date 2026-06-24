# Architecture — Conversion Analytics SDK

**Status:** Alinhado à implementação  
**Última revisão:** 2026-06-24  
**Substitui:** `architecture_lib_analytics.md` (planejamento com contrato Segment nativo)

## Visão geral

```
[LP Browser]
    │
    ├── analytics.init({ endpoint, appName, ... })
    │   └── AnalyticsBrowser.load() → plugins → auto page
    │
    ├── analytics.track('impression', { block_id, block_position })
    │   │
    │   ▼ Pipeline analytics-next: before → enrichment → destination
    │   │
    │   ├── [env-enrichment] (built-in, before)
    │   │   └── context.page, context.campaign (Segment nativo — complementar)
    │   │
    │   ├── [Conversion Consent] (before)
    │   │   └── Drop se isTrackingAllowed() === false ou DNT
    │   │
    │   ├── [click-id-enrichment] (before)
    │   │   └── gclid/fbclid/ttclid/msclkid → context.campaign
    │   │
    │   ├── [session-enrichment] (enrichment)
    │   │   └── context.sessionId (cookie/localStorage + TTL 5min)
    │   │
    │   ├── [Optional enrichments] (before/enrichment)
    │   │   └── consent, context, identify hashing, page taxonomy e GPT
    │   │
    │   └── [Conversion Collector] (destination)
    │       ├── contextToCollectEvent() → evento analytics-next nativo
    │       ├── BatchBuffer (size + interval + localStorage persist)
    │       ├── fetch POST [ CollectEvent, ... ]
    │       ├── retry com backoff (3 tentativas max)
    │       └── visibilitychange/pagehide → sendBeacon
    │
    ▼
[POST /collect] → Collector normalize() → ClickHouse + Redis
```

## Decisões arquiteturais

### Base: analytics-next fork

- Monorepo em `analytics-next/` (Yarn 3 + Turborepo)
- SDK produto: `packages/browser/src/conversion-sdk/` + `plugins/conversion-collector/`
- Build: `webpack.conversion-sdk.config.js` → `dist/umd/sdk.min.js`
- `AnalyticsBrowser.load()` com `integrations: { 'Segment.io': false }` — sem destination Segment

### Contrato de payload

O SDK envia o **array nativo da analytics-next**, em camelCase, sem flatten ou envelope
proprietário:

```ts
POST /collect
Content-Type: application/json

[CollectEvent, ...]
```

O Collector é responsável por normalizar esse payload para o schema flat do ClickHouse. Os
paths relevantes para o contrato são `context.sessionId`, `context.campaign.*` e
`properties.*`.

Ver [backend-contract.md](./backend-contract.md) para spec completa.

### Session storage

| Dado | Storage | Key / Cookie |
|------|---------|--------------|
| `sessionId` | Cookie + localStorage fallback | `_utua_session` / `utua_session` |
| `lastActivity` | Cookie + localStorage fallback | `_utua_last_activity` / `utua_last_activity` |
| `anonymousId` | localStorage | storage nativo analytics-next |
| `query_params` (opcional) | sessionStorage | chaves do plugin de page properties |
| Fila de eventos | localStorage | `utua_event_queue` |

- **TTL inatividade:** 5 minutos (`SESSION_INACTIVITY_MS`)
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
| click-id-enrichment | before | `context.campaign.*` | Não |
| session-enrichment | enrichment | `context.sessionId` | Não |
| Conversion Consent | before | Cancela | Não |
| Conversion Context | before | `context.*` | Não |
| Conversion Identify PII | enrichment | `traits` | Não |
| Conversion Page Properties | before | `properties` | Não |
| Conversion Collector | destination | Não | Sim |
| Conversion GPT Slot Events | utility | `track` automático | Não |

Erros em destination são capturados internamente (não propagam). Erros em enrichment
de session propagam — melhor falhar que enviar sem `sessionId`.

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
    ├── context-to-collect-event.ts
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
- **Endpoint default:** `/collect` (configurável)
- Ver [../DISTRIBUTING-STATIC-SDK.md](../DISTRIBUTING-STATIC-SDK.md)

## Testes

| Tipo | Localização | Cobertura |
|------|-------------|-----------|
| Unitário | `plugins/conversion-collector/**/__tests__/` | session, fila, send-events, parity |
| Unitário | `conversion-sdk/__tests__/` | bootstrap, globals |
| Integração | `parity.integration.test.ts` | pipeline end-to-end com mock fetch |
| E2E Playwright | `packages/browser-integration-tests/src/conversion-sdk/` | LP real, session flow, offline recovery e flush on unload |

## Divergências vs planejamento original

| Planejamento original | Implementação atual |
|-----------------------|---------------------|
| `packages/sdk/` no monorepo pipeline | Embutido no fork analytics-next |
| Apenas `window.analytics.init(writeKey)` | `window.analytics` + aliases `ConversionAnalytics`, com writeKey ou objeto de config |
| Apenas UTMs nativas | UTMs em `context.campaign.*`; click-ids adicionados em `context.campaign.*` |
| 2 plugins (session + collector) | 5 plugins (+ GPT opcional) |

Estas divergências são **intencionais** e documentadas. O Collector deve implementar
`normalize()` conforme [backend-contract.md](./backend-contract.md). A principal pendência
externa é alinhar o Collector Go em produção ao contrato nativo ou manter um proxy de tradução
same-origin durante a migração.

## Phase 2 (deferred)

- Configuration Server dinâmico
- Config por domínio/país
- Toggle de plugins via config remota
- Métricas de delivery do SDK
- Wrapper oficial Next.js / React
