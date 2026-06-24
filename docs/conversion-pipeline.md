# Conversion Analytics SDK

Browser SDK para o Conversion Pipeline — **script tag only** (same-domain).
Construído sobre o fork analytics-next com plugins `conversion-collector`.

> Documentação completa: [conversion-sdk/README.md](./conversion-sdk/README.md)

## Quick start (2 linhas)

Hospede `sdk.min.js` no mesmo domínio do Collector:

```html
<script src="/assets/sdk.min.js"></script>
<script>
  analytics.init('conversion-pipeline');
</script>
```

`ConversionAnalytics` permanece como alias de `window.analytics` para compatibilidade.

O IIFE auto-bootstrapa `window.ConversionAnalytics`, reprocessa chamadas do stub e envia
um `page` inicial (salvo se o host enfileirou um).

## Stub snippet (load async, queue early events)

```html
<script async>
!function(e,t,r,n,o,a){if(!e[o]){var c=e[o]=function(){c.queue.push({type:arguments[0],arguments:Array.prototype.slice.call(arguments).slice(1)})};c.queue=[],c.track=function(){c.queue.push({type:"track",arguments:Array.prototype.slice.call(arguments)})},c.identify=function(){c.queue.push({type:"identify",arguments:Array.prototype.slice.call(arguments)})},c.page=function(){c.queue.push({type:"page",arguments:Array.prototype.slice.call(arguments)})},c.config={endpoint:"/collect",appName:"my-lp"},c.version="1.0",c.loaded=!0,e["_"+o]||(e["_"+o]=c),c.start=function(){var e=t.createElement(r);e.src="/assets/sdk.min.js",e.async=!0;var n=t.getElementsByTagName(r)[0];n.parentNode.insertBefore(e,n)}}}(window,document,"script",0,"ConversionAnalytics");
ConversionAnalytics.start();
</script>
```

## Build

```bash
cd packages/browser
yarn build:conversion-sdk
```

| Artefato | Uso |
|----------|-----|
| `dist/umd/sdk.min.js` | Produção — deploy na LP |
| `dist/umd/conversion-analytics.build.js` | Debug |
| `script/sdk.min.js` | Espelho versionado no repo |

Ver [DISTRIBUTING-STATIC-SDK.md](./DISTRIBUTING-STATIC-SDK.md).

## Instrumentação ad-tech

```javascript
ConversionAnalytics.track('impression', {
  block_id: 'top_father',
  block_position: 1,
});

ConversionAnalytics.track('ad_request', {
  block_id: 'top_father',
  ad_request_id: 'req_abc123',
});

ConversionAnalytics.track('viewability', {
  block_id: 'top_father',
  block_position: 1,
  viewable: true,
});

ConversionAnalytics.identify({ email: 'user@example.com' });
```

Campos obrigatórios por evento: [conversion-sdk/event-schema.md](./conversion-sdk/event-schema.md).

## API pública

**Global:** `window.ConversionAnalytics`

| Método | Descrição |
|--------|-----------|
| `init(config)` | Inicializa SDK |
| `track(event, properties?)` | Evento customizado |
| `page(properties?)` | Page view |
| `identify(userOrTraits, traits?)` | Identificação; PII hasheada no Collector ou enrichment opcional |
| `flush()` | Flush manual |
| `getDebugInfo()` | Debug: sessionId, endpoint, queueSize |
| `getQueueSize()` | Tamanho da fila |

## Init options

| Option | Default | Description |
|--------|---------|-------------|
| `endpoint` | `/collect` | URL POST do Collector (same origin) |
| `appName` | — | Nome no `context.app` |
| `debug` | `false` | Painel de debug on-page |
| `flushIntervalMs` | `3000` | Intervalo de flush |
| `batchSize` | `10` | Eventos por batch |
| `retryAttempts` | `2` | Retries por batch |
| `isTrackingAllowed` | — | Hook de consentimento |
| `respectDoNotTrack` | `false` | Honrar DNT do browser |
| `enableGptSlotEvents` | `false` | Listeners GPT slot |

## Pipeline interno

1. **env-enrichment** (built-in) — `context.page`, `context.campaign`
2. **Conversion Consent** — drop se tracking não permitido
3. **click-id-enrichment** — click-ids em `context.campaign`
4. **session-enrichment** — `context.sessionId`
5. **Conversion enrichments opcionais** — consent, context, identify hashing, page taxonomy
6. **Conversion Collector** — batch POST `[ CollectEvent, ... ]`
7. **Conversion GPT Slot Events** (opcional)

## Contrato com o Collector

- **Method:** `POST`
- **Body:** `[ CollectEvent, ... ]` (array nativo analytics-next, camelCase)
- **Session:** `context.sessionId` (UUID v4)
- **Atribuição:** `context.campaign.*` (UTMs + click-ids); `properties.*` para campos ad-tech e fallback

Spec completa: [conversion-sdk/backend-contract.md](./conversion-sdk/backend-contract.md).

## Documentação

| Doc | Conteúdo |
|-----|----------|
| [conversion-sdk/prd.md](./conversion-sdk/prd.md) | Requisitos funcionais |
| [conversion-sdk/architecture.md](./conversion-sdk/architecture.md) | Arquitetura e data flow |
| [conversion-sdk/event-schema.md](./conversion-sdk/event-schema.md) | Schema por tipo de evento |
| [conversion-sdk/pii-and-consent.md](./conversion-sdk/pii-and-consent.md) | PII e consentimento |
| [conversion-sdk/migration-rollout.md](./conversion-sdk/migration-rollout.md) | Rollout |

## Bundle size

Medição atual do artefato versionado:

- `packages/browser/dist/umd/sdk.min.js`: ~30,1 KiB gzip
- `script/sdk.min.js`: ~29,8 KiB gzip

O target permanece ≤ 30 KB gzip; o bundle está no limite e precisa de medição em cada build.

## Next.js

```tsx
'use client';
import { useEffect } from 'react';

export function Analytics({ appName }: { appName: string }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/assets/sdk.min.js';
    script.onload = () =>
      window.ConversionAnalytics.init({ endpoint: '/collect', appName });
    document.head.appendChild(script);
  }, [appName]);
  return null;
}
```
