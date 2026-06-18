# Conversion Analytics SDK — Documentação

Documentação canônica do SDK browser do Conversion Pipeline. Reflete a implementação em
`packages/browser/src/conversion-sdk/` e `packages/browser/src/plugins/conversion-collector/`.

> **Contrato vigente:** `window.analytics` + payload **analytics-next nativo**
> (`JSON.stringify([event, ...])`, camelCase, `context.sessionId`, `context.campaign.*`).

## Índice

| Documento | Conteúdo |
|-----------|----------|
| [../conversion-pipeline.md](../conversion-pipeline.md) | Quick start, snippet, build |
| [prd.md](./prd.md) | Requisitos funcionais e não-funcionais (alinhados à implementação) |
| [architecture.md](./architecture.md) | Decisões arquiteturais, plugins, data flow |
| [backend-contract.md](./backend-contract.md) | Contrato HTTP + spec do `normalize()` para o Collector |
| [collector-prod-api.md](./collector-prod-api.md) | API Go em produção (verificado) vs SDK MVP |
| [event-schema.md](./event-schema.md) | Campos obrigatórios por tipo de evento ad-tech |
| [page-taxonomy.md](./page-taxonomy.md) | Parser de path (`country`, `vertical`, etc.) |
| [pii-and-consent.md](./pii-and-consent.md) | Hashing de PII e hooks de consentimento |
| [migration-rollout.md](./migration-rollout.md) | Rollout e fallback do legado |
| [../DISTRIBUTING-STATIC-SDK.md](../DISTRIBUTING-STATIC-SDK.md) | Build, deploy same-domain, CI |

## Contrato em uma linha

```
POST {endpoint}  →  [ CollectEvent, ... ]
```

- **Global:** `window.analytics` (alias `ConversionAnalytics`; `globalName` em `init`)
- **API MVP:** `init`, `track`, `page`, `identify`
- **Endpoint padrão:** `/collect`
- **Session:** `context.sessionId` (cookies `_utua_session` / `_utua_last_activity`, fallback LS, TTL 5min inatividade)
- **Atribuição:** UTMs em `context.campaign` (env-enrichment); click-ids em `context.campaign` (click-id-enrichment)
