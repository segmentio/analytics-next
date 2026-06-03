# Contrato SDK ↔ Backend (Collector)

Este documento descreve o que o **backend do Conversion Pipeline** deve expor e o que a **SDK browser** envia. Assim o time do collector pode implementar validação (ex.: Zod) alinhada ao cliente.

## Endpoint

- **Método:** `POST`
- **Path:** configurável no front via `init({ endpoint })`. Valor padrão da SDK: **`/collector`** (path relativo ao origin) ou URL absoluta, ex.: `https://api.exemplo.com/collector`.
- **Content-Type:** `application/json`
- **Corpo:** objeto com uma única chave `events` (array, mínimo 1 item após flush em lote).

Headers extras podem ser enviados pelo front com `init({ headers: { ... } })` (ex.: API key interna, se vocês decidirem).

## Corpo da requisição (`CollectRequestBody`)

```ts
interface CollectRequestBody {
  events: AnalyticsEventEnvelope[];
}
```

### `AnalyticsEventEnvelope`

| Campo | Tipo | Obrigatório | Observação |
|--------|------|-------------|------------|
| `type` | `"track" \| "identify"` | sim | |
| `event_name` | `string` | para `track` | Nome real do evento |
| `anonymous_id` | `string` | sim | UUID v4 válido (persistido em `localStorage`; regenerado se inválido) |
| `user_id` | `string` | opcional | Em `identify`; em `track` repetido após um `identify` bem-sucedido (mesmo id) |
| `traits` | `object` | opcional | Comum em `identify` |
| `properties` | `object` | opcional | Comum em `track` |
| `context` | `object` | sim | Ver tabela abaixo; `getContext()` pode acrescentar campos |
| `integrations` | `object` | opcional | Overrides por destino no formato Segment |
| `message_id` | `string` | sim | ID único por mensagem |
| `original_timestamp` | `string` (ISO 8601) | sim | Momento original da criação do evento |
| `sent_at` | `string` (ISO 8601) | sim | Momento em que o lote foi enviado |
| `timestamp` | `string` (ISO 8601) | sim | |
| `version` | `2` | sim | Compatível com o envelope comum da Segment |

### `context` (formato enviado pela SDK)

| Campo | Tipo | Observação |
|--------|------|------------|
| `session_id` | `string` | Identificador de sessão browser |
| `app` | `object` | Hoje envia `{ name }` a partir de `init({ appName })` |
| `library` | `object` | `{ name, version }` da SDK |
| `channel` | `string` | `"browser"` |
| `page` | `object` | `path`, `search`, `url`, `title`, `referrer` |
| `locale` | `string` | `navigator.language` |
| `screen` | `object` | `{ width, height }` |
| `traits` | `object` | Repetido em `track` após `identify`, quando disponível |
| `timezone` | `string` | `Intl.DateTimeFormat().resolvedOptions().timeZone` |
| `userAgent` | `string` | `navigator.userAgent` |

### Exemplo mínimo (`track`)

```json
{
  "events": [
    {
      "type": "track",
      "anonymous_id": "550e8400-e29b-41d4-a716-446655440001",
      "event_name": "quiz_started",
      "properties": { "quizId": "q1" },
      "message_id": "550e8400-e29b-41d4-a716-446655440002",
      "original_timestamp": "2026-03-23T12:00:00.000Z",
      "sent_at": "2026-03-23T12:00:01.000Z",
      "context": {
        "session_id": "550e8400-e29b-41d4-a716-446655440000",
        "app": { "name": "quiz-static" },
        "library": { "name": "conversion-analytics-sdk", "version": "0.1.0" },
        "channel": "browser",
        "page": {
          "path": "/quiz",
          "search": "",
          "url": "https://exemplo.com/quiz",
          "title": "Quiz",
          "referrer": "https://google.com/"
        },
        "locale": "pt-BR",
        "screen": { "width": 1920, "height": 1080 },
        "timezone": "America/Sao_Paulo",
        "userAgent": "Mozilla/5.0 ..."
      },
      "timestamp": "2026-03-23T12:00:00.000Z",
      "version": 2
    }
  ]
}
```

### Exemplo (`identify`)

```json
{
  "events": [
    {
      "type": "identify",
      "anonymous_id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": "user-123",
      "traits": { "email": "a@b.com" },
      "message_id": "550e8400-e29b-41d4-a716-446655440002",
      "original_timestamp": "2026-03-23T12:00:01.000Z",
      "sent_at": "2026-03-23T12:00:01.050Z",
      "context": { "session_id": "...", "page": { "url": "https://...", "title": "...", "referrer": "" } },
      "timestamp": "2026-03-23T12:00:01.000Z",
      "version": 2
    }
  ]
}
```

### `page` e atribuição (FE-3 / FE-4)

Eventos `track` com `event_name: "page"` incluem em `properties`:

| Campo | Observação |
| --- | --- |
| `query_params` | Objeto com **todos** os parâmetros da query da landing (primeira captura da sessão) |
| `utm_*`, `gclid`, `fbclid`, `tt_clid`, `ttclid`, `msclkid`, `twclid`, `to`, `p`, `ref` | Repetidos no top-level quando presentes (colunas dedicadas BE) |
| `page_path` | `pathname` atual no envio do `page` |
| `visitor_country` | `getVisitorCountry()` ou região de `navigator.language` |
| `country`, `vertical`, `product`, `funnel` | Taxonomia do primeiro segmento do path — ver [page-taxonomy.md](./page-taxonomy.md) |

`query_params` e colunas dedicadas são reutilizados em `track` / `identify` da mesma sessão (`sessionStorage`: `__bg_analytics_query_params`).

### `identify` — PII (FE-2)

Ver [pii-and-consent.md](./pii-and-consent.md). Resumo: `email` / `phone` hasheados (SHA-256); aliases `email_hash` / `phone_hash`; `email_domain` em claro.

### Eventos GPT (FE-5 / FE-6)

`event_name` canônicos (sem wrapper `ads`): `slotRequested`, `slotResponseReceived`, `slotRenderEnded`, `slotOnload`, `impressionViewable`, `slotEmpty`.

Propriedades comuns: `slot_id`, `slot_element_id`, `ad_unit_path`, `is_empty`, `width`, `height`, `size_rendered`, `is_backfill`, `creative_id`, `line_item_id`, `event_timestamp_ms`. Em `slotRenderEnded`: `scroll_y_at_render`, `slot_top_offset`, `slot_visible_on_render`.

## QA manual (`anonymous_id`, FE-1)

1. Abra o site com a SDK, dispare um `track` ou aguarde o `page` automático do bootstrap.
2. No DevTools → **Network**, filtre pelo `POST` do collector e inspecione o corpo JSON.
3. Confirme que `events[].anonymous_id` e `events[].message_id` são **UUID v4** (formato `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`, `y` ∈ `8|9|a|b`).
4. Recarregue a página: o mesmo `anonymous_id` deve persistir (chave `localStorage`: `__bg_analytics_anonymous_id`).
5. Se o valor salvo não for UUID v4, a SDK substitui por um novo na próxima leitura.

## Comportamento da SDK (relevante para o backend)

- Eventos são **enfileirados** e enviados em **lotes** (`batchSize`, default 10) e/ou no intervalo `flushIntervalMs` (default 2000 ms).
- Chamadas de **`identify`** também forçam um **flush imediato** para reduzir perda em páginas que navegam logo após a identificação.
- Um único `POST` pode conter **vários** itens em `events`.
- Em falha de rede/5xx, a SDK faz **retry** com backoff (`retryAttempts`, default 2) e pode **recolocar** o lote na fila.

## Resposta sugerida (referência)

A SDK hoje considera sucesso qualquer resposta com `response.ok` (2xx). Exemplo alinhado ao collector dev:

- **`202 Accepted`** com corpo JSON opcional, ex.: `{ "ok": true, "accepted": <number> }`

Erros **`4xx`** com corpo JSON padronizado ajudam o debug no front (a SDK hoje só registra falha e re-enfileira conforme config).

## CORS

O collector em produção deve enviar headers CORS adequados para os domínios dos fronts que usam a SDK (`POST` + `Content-Type: application/json`).

## Tipos TypeScript

Definições de referência no fork (`packages/browser/src/plugins/conversion-collector/types.ts`):

- `AnalyticsEventEnvelope`
- `CollectRequestBody`

Para consumo via script tag, use JSDoc ou copie os tipos do contrato acima — não há package npm publicado.
