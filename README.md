# Conversion Analytics SDK (analytics-next)

Fork do [Segment analytics-next](https://github.com/segmentio/analytics-next) mantido pela UTUA para o **Conversion Pipeline**: captura eventos de comportamento em landing pages (page views, impressões, cliques, identify) e envia em batch para o **Collector** via HTTP.

O produto entregue é um **script estático** (`sdk.min.js`, alvo ≤ 30 KB gzip) — não é um pacote npm publicado para as LPs. O monorepo reutiliza a base analytics-next (pipeline de plugins, batching, retry) com plugins customizados em `conversion-collector`.

## Para que serve

- Instrumentar LPs com eventos de **ad-tech** (`impression`, `ad_request`, `viewability`, `click`, etc.)
- Gerenciar **sessão** do visitante (UUID, cookies `_utua_*`, TTL de inatividade 5 min)
- Capturar **atribuição** (UTMs e click-ids em `context.campaign`)
- Enviar eventos em **batch** com persistência offline, retry e flush no unload
- Identificar usuários (`identify`) — PII em texto plano na lib; hash no Collector

## Uso na landing page

Hospede `sdk.min.js` no **mesmo domínio** do endpoint de coleta (recomendado: proxy `/collect` → Collector).

```html
<script src="/assets/sdk.min.js"></script>
<script>
  analytics.init('conversion-pipeline', {
    endpoint: '/collect',
    appName: 'minha-lp',
  });

  analytics.track('impression', {
    block_id: 'top_father',
    block_position: 1,
  });
</script>
```

| API (MVP) | Descrição |
|-----------|-----------|
| `init(writeKey, options?)` | Inicializa o SDK (`writeKey` ou objeto de config) |
| `track(event, properties?)` | Evento customizado |
| `page(properties?)` | Page view |
| `identify(userOrTraits, traits?)` | Identificação do usuário |

`window.ConversionAnalytics` é alias de `window.analytics`. Um `page` automático é enviado no bootstrap, salvo se o host já enfileirou um.

Para carregamento assíncrono com fila de eventos antes do script carregar, use o stub em [docs/conversion-pipeline.md](docs/conversion-pipeline.md).

## Build do SDK

```bash
yarn install
cd packages/browser
yarn build:conversion-sdk
```

| Artefato | Uso |
|----------|-----|
| `packages/browser/dist/umd/sdk.min.js` | Produção — deploy na LP |
| `packages/browser/dist/umd/sdk.{hash}.min.js` | Versão com hash de conteúdo |
| `script/sdk.min.js` | Espelho versionado no repositório |

Medição atual: `packages/browser/dist/umd/sdk.min.js` ~30,1 KiB gzip e `script/sdk.min.js` ~29,8 KiB gzip. O bundle está no limite do budget.

Detalhes de deploy same-domain: [docs/DISTRIBUTING-STATIC-SDK.md](docs/DISTRIBUTING-STATIC-SDK.md).

## Desenvolvimento e testes

```bash
# Testes unitários (SDK + collector plugins)
yarn jest --testPathPattern="conversion-sdk|conversion-collector"

# Typecheck
yarn typecheck

# E2E (Playwright)
cd packages/browser-integration-tests
yarn pretest:conversion-sdk   # copia sdk.min.js
yarn test:conversion-sdk
```

## Contrato com o Collector

A SDK envia payload **analytics-next nativo**:

```
POST {endpoint}  →  [ CollectEvent, ... ]
```

- `context.sessionId` — UUID v4 da sessão
- `context.campaign` — UTMs + click-ids (`gclid`, `fbclid`, …)
- camelCase (`anonymousId`, `messageId`, `event`, …)

O Collector em produção ([conversion-pipeline-collector.utua.work](https://conversion-pipeline-collector.utua.work/)) ainda espera `{ events: [...] }` em snake_case — ver gap e plano de migração em [docs/conversion-sdk/collector-prod-api.md](docs/conversion-sdk/collector-prod-api.md).

## Estrutura do repositório

| Caminho | Conteúdo |
|---------|----------|
| `packages/browser/src/conversion-sdk/` | API pública, bootstrap, `init(writeKey)` |
| `packages/browser/src/plugins/conversion-collector/` | Pipeline: session, click-ids, batch, POST |
| `packages/conversion-pipeline-collector/` | Referência TypeScript do `normalize()` (portar para Go) |
| `packages/browser-integration-tests/` | Testes E2E Playwright |
| `docs/conversion-sdk/` | PRD, arquitetura, contrato backend, schema de eventos |

## Documentação

- [Quick start e instrumentação](docs/conversion-pipeline.md)
- [Índice da documentação do SDK](docs/conversion-sdk/README.md)
- [Contrato SDK ↔ Collector](docs/conversion-sdk/backend-contract.md)

## Monorepo (upstream Segment)

Este repositório ainda contém os pacotes originais do analytics-next, usados como base interna:

- `@segment/analytics-next` — SDK browser (fork + Conversion SDK)
- `@segment/analytics-node` — SDK Node.js
- `@segment/analytics-core` — núcleo compartilhado

Para contribuir no fork: [CONTRIBUTING.md](CONTRIBUTING.md) · [DEVELOPMENT.md](DEVELOPMENT.md)
