# Contrato SDK ↔ Collector (Backend)

Especificação canônica do que a SDK envia e o que o Collector deve implementar.
Contrato alinhado ao payload **analytics-next nativo** enviado pela SDK MVP.

## Endpoint

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path default | `/collect` |
| Path configurável | `init({ endpoint: '/collect' })` — same origin recomendado |
| Content-Type | `application/json` |
| CORS | `POST` + `Content-Type: application/json` nos domínios das LPs |

Headers extras via `init({ headers: { ... } })`.

## Corpo da requisição

```ts
type CollectRequestBody = CollectEvent[] // mínimo 1 após flush
```

### `CollectEvent` (analytics-next nativo, camelCase)

| Campo | Tipo | Obrigatório | Observação |
|-------|------|-------------|------------|
| `type` | `"track" \| "page" \| "identify" \| "screen"` | sim | |
| `event` | `string` | para `track` | Nome do evento (`impression`, etc.) |
| `anonymousId` | `string` | sim | UUID v4 (env-enrichment / user store) |
| `userId` | `string` | opcional | Após `identify` |
| `traits` | `object` | opcional | `identify` — PII em texto por default; hash no Collector ou enrichment opcional |
| `properties` | `object` | opcional | `track` / `page` — ad-tech |
| `context` | `object` | sim | Ver tabela abaixo |
| `integrations` | `object` | opcional | Overrides Segment |
| `messageId` | `string` | sim | UUID v4, estável em retries |
| `originalTimestamp` | ISO 8601 | sim | Criação do evento |
| `sentAt` | ISO 8601 | sim | Momento do envio do lote |
| `timestamp` | ISO 8601 | sim | |
| `_metadata` | `{ retryCount: number }` | sim | Contagem de retries do lote |

### `context`

| Campo | Tipo | Observação |
|-------|------|------------|
| `sessionId` | `string` | **UUID v4** — chave primária para `normalize()` / Redis |
| `app` | `{ name: string }` | De `init({ appName })` |
| `library` | `{ name, version }` | `conversion-analytics-sdk` |
| `channel` | `string` | `"browser"` |
| `page` | `object` | `path`, `search`, `url`, `title`, `referrer` |
| `locale` | `string` | `navigator.language` |
| `screen` | `{ width, height }` | |
| `traits` | `object` | Repetido em `track` após `identify` |
| `timezone` | `string` | |
| `userAgent` | `string` | |
| `campaign` | `object` | UTMs (`source`, `medium`, `name`, …) + click-ids (`gclid`, `fbclid`, …) |

### `properties` — atribuição e ad-tech

| Campo | Origem | Coluna ClickHouse sugerida |
|-------|--------|---------------------------|
| `query_params` | Auto (primeira página da sessão) | JSON ou flatten |
| `utm_source` | Auto | `utm_source` |
| `utm_medium` | Auto | `utm_medium` |
| `utm_campaign` | Auto | `utm_campaign` |
| `utm_content` | Auto | `utm_content` |
| `utm_term` | Auto | `utm_term` |
| `gclid` | Auto | `gclid` |
| `fbclid` | Auto | `fbclid` |
| `ttclid` / `tt_clid` | Auto | `ttclid` |
| `msclkid` | Auto | `msclkid` |
| `twclid` | Auto | `twclid` |
| `block_id` | Dev (`track`) | `block_id` |
| `block_position` | Dev (`track`) | `block_position` |
| `ad_request_id` | Dev (`track`) | `ad_request_id` |
| `viewable` | Dev (`track`) | `viewable` |
| `page_path` | Auto (`page`) | `page_path` |
| `visitor_country` | Auto | `visitor_country` |
| `country`, `vertical`, `product`, `funnel` | Auto (taxonomy) | respectivos |

Ver [event-schema.md](./event-schema.md) para campos obrigatórios por tipo de evento.

---

## `normalize()` — spec para o Collector

O Collector recebe `CollectRequestBody` e produz registros flat para ClickHouse + chaves Redis.

### Pseudocódigo

```typescript
function normalize(event: CollectEvent): FlatEvent {
  const ctx = event.context ?? {}
  const props = event.properties ?? {}
  const traits = event.traits ?? {}
  const campaign = ctx.campaign ?? {}

  return {
    // Identidade
    message_id: event.messageId,
    anonymous_id: event.anonymousId,
    user_id: event.userId ?? null,
    session_id: ctx.sessionId, // UUID v4 — obrigatório
    event_type: event.type === 'identify'
      ? 'identify'
      : event.type === 'page'
      ? 'page'
      : event.event,

    // Timestamps
    timestamp: event.timestamp,
    original_timestamp: event.originalTimestamp,
    sent_at: event.sentAt,

    // Page context
    page_url: ctx.page?.url,
    page_path: props.page_path ?? ctx.page?.path,
    page_title: ctx.page?.title,
    referrer: ctx.page?.referrer,

    // Atribuição: context.campaign é a fonte canônica; properties/query_params são fallback
    utm_source: campaign.source ?? props.utm_source ?? props.query_params?.utm_source,
    utm_medium: campaign.medium ?? props.utm_medium ?? props.query_params?.utm_medium,
    utm_campaign: campaign.name ?? campaign.campaign ?? props.utm_campaign ?? props.query_params?.utm_campaign,
    utm_content: campaign.content ?? props.utm_content ?? props.query_params?.utm_content,
    utm_term: campaign.term ?? props.utm_term ?? props.query_params?.utm_term,
    gclid: campaign.gclid ?? props.gclid ?? props.query_params?.gclid,
    fbclid: campaign.fbclid ?? props.fbclid ?? props.query_params?.fbclid,
    ttclid: campaign.ttclid ?? campaign.tt_clid ?? props.ttclid ?? props.tt_clid ?? props.query_params?.ttclid,

    // Ad-tech (de properties)
    block_id: props.block_id,
    block_position: props.block_position,
    ad_request_id: props.ad_request_id,
    viewable: props.viewable,

    // Taxonomia
    visitor_country: props.visitor_country,
    country: props.country,
    vertical: props.vertical,
    product: props.product,
    funnel: props.funnel,

    // PII
    email_hash: hashPiiField(traits.email ?? traits.email_hash),
    phone_hash: hashPiiField(traits.phone ?? traits.phone_hash),
    email_domain: traits.email_domain,

    // Raw payload (opcional, para debug)
    properties_json: JSON.stringify(props),
    context_json: JSON.stringify(ctx),
  }
}
```

### Validações recomendadas

| Regra | Ação |
|-------|------|
| `context.sessionId` ausente ou não UUID v4 | Rejeitar evento (4xx) ou alertar + quarentena |
| `impression`/`viewability`/`click` sem `block_id` | Aceitar mas marcar `quality_flag: incomplete` |
| `ad_request` sem `ad_request_id` | Idem |
| `message_id` duplicado | Dedup server-side (idempotência) |

### Redis session key

O `context.sessionId` do evento é o **mesmo** usado pelo Redis/Collector para agregação.
Formato UUID v4, sem transformação. TTL server-side alinhado com inatividade de 5min
(+ margem para flush atrasado).

---

## Resposta HTTP

A SDK considera sucesso qualquer **2xx** (`response.ok`).

Resposta recomendada:

```http
HTTP/1.1 202 Accepted
Content-Type: application/json

{ "ok": true, "queued": 3 }
```

| Status | SDK behavior |
|--------|--------------|
| 2xx | Sucesso, remove da fila |
| 429 | Retry com `Retry-After` |
| 5xx | Retry com backoff |
| 4xx (exceto 429) | Descarta batch (não retenta) |

Corpo de erro padronizado ajuda debug:

```json
{ "ok": false, "error": "invalid_session_id", "detail": "..." }
```

---

## Exemplos

### `track` — impression

```json
[
  {
    "type": "track",
    "event": "impression",
    "anonymousId": "550e8400-e29b-41d4-a716-446655440001",
    "messageId": "550e8400-e29b-41d4-a716-446655440002",
    "properties": {
      "block_id": "top_father",
      "block_position": 1
    },
    "context": {
      "sessionId": "660e8400-e29b-41d4-a716-446655440000",
      "campaign": {
        "source": "google",
        "gclid": "abc123"
      },
      "page": { "url": "https://lp.example.com/usa-cc-p1", "path": "/usa-cc-p1" },
      "library": { "name": "conversion-analytics-sdk", "version": "1.0.0" },
      "channel": "browser"
    },
    "originalTimestamp": "2026-06-08T12:00:00.000Z",
    "sentAt": "2026-06-08T12:00:01.000Z",
    "timestamp": "2026-06-08T12:00:00.000Z",
    "_metadata": { "retryCount": 0 }
  }
]
```

### `identify`

```json
[
  {
    "type": "identify",
    "anonymousId": "550e8400-e29b-41d4-a716-446655440001",
    "userId": "user-123",
    "traits": {
      "email": "user@example.com",
      "email_domain": "example.com"
    },
    "context": { "sessionId": "660e8400-e29b-41d4-a716-446655440000" },
    "messageId": "...",
    "originalTimestamp": "...",
    "sentAt": "...",
    "timestamp": "...",
    "_metadata": { "retryCount": 0 }
  }
]
```

---

## Comportamento da SDK (relevante para o backend)

- Batching: default 10 eventos ou 3s (configurável)
- `identify` força flush imediato
- Um `POST` pode conter múltiplos eventos
- `sendBeacon` no unload não espera resposta — tratar como at-least-once
- `message_id` estável permite dedup em reentregas

## Tipos TypeScript de referência

`packages/browser/src/plugins/conversion-collector/types.ts`:

- `CollectEvent`
- `CollectRequestBody`
- `ConversionCollectorSettings`

## Migração do contrato anterior

Se o Collector foi implementado para o contrato antigo em envelope v2/snake_case, atualizar:

| Antes (legado) | Agora (SDK atual) |
|----------------|-------------------|
| Body: `{ events: [...] }` | Body: `[event, event]` (array nativo) |
| `context.session_id` | `context.sessionId` |
| `anonymous_id`, `message_id`, `event_name` | `anonymousId`, `messageId`, `event` |
| UTMs apenas em `properties.utm_*` | `context.campaign.*` como fonte canônica, `properties` como fallback |
| Endpoint `/collector` ou `/v1/conversion/collect` direto | Endpoint same-origin `/collect` com proxy/rewrite para o Collector |
| Envelope v2 com snake_case | Payload analytics-next nativo camelCase |
