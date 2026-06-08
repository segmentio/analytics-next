# Collector em produção — API verificada

**Base URL (PRD):** https://conversion-pipeline-collector.utua.work/  
**Swagger:** https://conversion-pipeline-collector.utua.work/swagger/index.html  
**Health:** `GET /v1/health` → `200`  
**Ingest:** `POST /v1/conversion/collect` → `202`

## Contrato atual (Go, jun/2026)

O serviço em produção **ainda não aceita** o payload nativo em array que a SDK MVP envia hoje.

| Aspecto | SDK MVP (lib atual) | Collector PRD (verificado) |
|---------|---------------------|----------------------------|
| Path | `/collect` (same-origin) | `/v1/conversion/collect` |
| Body | `[ CollectEvent, ... ]` | `{ "events": [ EventEnvelope ] }` |
| Session | `context.sessionId` | `context.session_id` (obrigatório) |
| IDs | camelCase (`anonymousId`, `messageId`) | snake_case (`anonymous_id`, `message_id`) |
| Track name | `event` | `event_name` (ou `event` em alguns casos) |
| Resposta 202 | `{ ok: true, queued: N }` | `{ status: "accepted", message: "N events queued for processing" }` |

### Exemplo aceito em produção

```json
POST /v1/conversion/collect

{
  "events": [{
    "type": "track",
    "event_name": "page",
    "anonymous_id": "550e8400-e29b-41d4-a716-446655440001",
    "message_id": "550e8400-e29b-41d4-a716-446655440002",
    "timestamp": "2026-06-08T12:00:00.000Z",
    "context": {
      "session_id": "660e8400-e29b-41d4-a716-446655440000",
      "page": { "path": "/test" }
    },
    "properties": {}
  }]
}
```

Resposta:

```json
HTTP/1.1 202 Accepted

{ "status": "accepted", "message": "1 events queued for processing" }
```

### Rejeições observadas

| Payload | HTTP | Erro |
|---------|------|------|
| Array nativo `[{...}]` | 500 | `cannot unmarshal array into Go value of type dtos.CollectRequestBody` |
| `context.sessionId` sem `session_id` | 400 | `events[0].context.sessionId is required` *(mensagem enganosa — exige `session_id`)* |

## Mudanças necessárias no Collector (Go)

Para alinhar ao contrato da lib (Caminho A):

1. **`parseCollectBody`** — aceitar **array nativo** ou `{ events }` (compat rollout).
2. **`normalize()`** — ler `context.sessionId` e `context.campaign.*` (camelCase).
3. **Resposta** — aceitar ambos `{ ok, queued }` e `{ status, message }` na SDK; padronizar em `{ ok: true, queued: N }` ou manter legado documentado.
4. **`session_id`** — aceitar alias `sessionId` durante migração.
5. **Atribuição** — priorizar `context.campaign` (UTMs + click-ids), fallback `properties`.

Referência TypeScript (portar para Go): `packages/conversion-pipeline-collector/`.

## SDK × produção hoje

Até o deploy do Collector atualizado, opções:

1. **Proxy same-origin** — LP expõe `/collect` e traduz array nativo → `{ events }` snake_case → upstream PRD.
2. **Flag na SDK** — `payloadFormat: 'envelope'` no `init()` (wire compat) mantendo pipeline nativo internamente.
3. **Deploy Collector** — implementar parse dual no serviço Go.

## Endpoints por ambiente

| Ambiente | URL collect |
|----------|-------------|
| PRD | `https://conversion-pipeline-collector.utua.work/v1/conversion/collect` |
| STG | `https://conversion-pipeline-collector.stg.utua.work/v1/conversion/collect` |
