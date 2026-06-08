# Schema de eventos — instrumentação ad-tech

Guia para devs que instrumentam landing pages. Campos que o Collector extrai via `normalize()`
estão marcados com **BE**.

## Convenções gerais

- Todos os eventos incluem `context.session_id` automaticamente — **não** passe manualmente.
- UTMs e click-ids são capturados na primeira página da sessão e replicados em eventos
  subsequentes via `properties.query_params` e colunas dedicadas.
- Campos ad-tech vão em `properties` (top-level do envelope), não em `context`.

## `page` (automático no bootstrap)

Disparado automaticamente após `init()` / `start()`, salvo se o host enfileirou um `page` no stub.

```javascript
ConversionAnalytics.page({ custom: 'value' }); // opcional
```

### Campos em `properties`

| Campo | Obrigatório | BE | Descrição |
|-------|-------------|-----|-----------|
| `page_path` | auto | ✅ | `window.location.pathname` |
| `query_params` | auto | ✅ | Todos os params da query na primeira captura da sessão |
| `utm_source` | auto* | ✅ | Promovido de `query_params` quando presente |
| `utm_medium` | auto* | ✅ | |
| `utm_campaign` | auto* | ✅ | |
| `utm_content` | auto* | ✅ | |
| `utm_term` | auto* | ✅ | |
| `gclid` | auto* | ✅ | Google Ads click ID |
| `fbclid` | auto* | ✅ | Meta click ID |
| `ttclid` / `tt_clid` | auto* | ✅ | TikTok click ID |
| `msclkid` | auto* | ✅ | Microsoft Ads |
| `twclid` | auto* | ✅ | Twitter/X |
| `visitor_country` | auto | ✅ | `getVisitorCountry()` ou região de `navigator.language` |
| `country` | auto | ✅ | Taxonomia do path — ver [page-taxonomy.md](./page-taxonomy.md) |
| `vertical` | auto | ✅ | |
| `product` | auto | ✅ | |
| `funnel` | auto | ✅ | |

\*Presente apenas quando o parâmetro existia na URL de entrada da sessão.

## `impression`

```javascript
ConversionAnalytics.track('impression', {
  block_id: 'top_father',
  block_position: 1,
});
```

| Campo | Obrigatório | BE | Descrição |
|-------|-------------|-----|-----------|
| `block_id` | **sim** | ✅ | Identificador do bloco publicitário |
| `block_position` | recomendado | ✅ | Posição ordinal do bloco na página |
| `query_params` + UTMs | auto | ✅ | Herdados da sessão |

Sem `block_id`, o session profile no pipeline não terá `blocks_viewed` — regras de conversão
não disparam.

## `ad_request`

```javascript
ConversionAnalytics.track('ad_request', {
  block_id: 'top_father',
  ad_request_id: 'req_abc123',
});
```

| Campo | Obrigatório | BE | Descrição |
|-------|-------------|-----|-----------|
| `block_id` | **sim** | ✅ | |
| `ad_request_id` | **sim** | ✅ | ID único da requisição de anúncio |

## `viewability`

```javascript
ConversionAnalytics.track('viewability', {
  block_id: 'top_father',
  block_position: 1,
  viewable: true,
});
```

| Campo | Obrigatório | BE | Descrição |
|-------|-------------|-----|-----------|
| `block_id` | **sim** | ✅ | |
| `block_position` | recomendado | ✅ | |
| `viewable` | **sim** | ✅ | `true` quando visível por tempo suficiente |

## `click`

```javascript
ConversionAnalytics.track('click', {
  block_id: 'top_father',
  block_position: 1,
  // propriedades adicionais conforme necessidade
});
```

| Campo | Obrigatório | BE | Descrição |
|-------|-------------|-----|-----------|
| `block_id` | **sim** | ✅ | |
| `block_position` | recomendado | ✅ | |

## `identify`

```javascript
ConversionAnalytics.identify('user-id', { email: 'user@example.com' });
// ou
ConversionAnalytics.identify({ email: 'user@example.com', phone: '+5511999999999' });
```

| Campo | Obrigatório | BE | Descrição |
|-------|-------------|-----|-----------|
| `user_id` | opcional | ✅ | Envelope `user_id` |
| `traits.email` | opcional | ✅ | Hasheado SHA-256 antes do envio — ver [pii-and-consent.md](./pii-and-consent.md) |
| `traits.phone` | opcional | ✅ | Normalizado E.164 + SHA-256 |
| `traits.email_domain` | auto | ✅ | Mantido em claro |

`identify` força flush imediato para reduzir perda em navegação rápida pós-formulário.

## Eventos GPT (opcional, `enableGptSlotEvents: true`)

| `event_name` | Descrição |
|--------------|-----------|
| `slotRequested` | Slot solicitado ao GPT |
| `slotResponseReceived` | Resposta recebida |
| `slotRenderEnded` | Render concluído |
| `slotOnload` | Slot carregado |
| `impressionViewable` | Impressão viewable |
| `slotEmpty` | Slot vazio |

Propriedades comuns: `slot_id`, `slot_element_id`, `ad_unit_path`, `is_empty`, `width`,
`height`, `size_rendered`, `is_backfill`, `creative_id`, `line_item_id`, `event_timestamp_ms`.

## Validação no Collector (recomendado)

O Collector deve logar/alertar quando:

- `context.session_id` ausente ou inválido (não UUID v4)
- `impression` / `viewability` / `click` sem `properties.block_id`
- `ad_request` sem `properties.ad_request_id`
- Queda > 40% de volume por `utm_campaign` + `page_path` (monitoramento AdOps)
