# Product Requirements Document — Conversion Analytics SDK

**Status:** Alinhado à implementação (fork analytics-next)  
**Última revisão:** 2026-06-24  
**Substitui:** `prd_lib_analytics.md` (planejamento original com contrato Segment nativo)

## Executive Summary

O **Conversion Analytics SDK** é o SDK frontend do Conversion Pipeline. Captura eventos de
engajamento (`page`, `impression`, `ad_request`, `click`, `viewability`) em landing pages e
envia ao Collector via HTTP batch.

É construído como **plugins customizados** sobre a biblioteca `analytics-next` (Segment),
reutilizando o plugin pipeline (`before` → enrichment → destination), batching, retry e
captura de contexto. Os plugins adicionam session management com timeout de inatividade,
destination para o Collector UTUA, atribuição de mídia paga, hashing de PII e (opcionalmente)
eventos GPT.

### Público-alvo

- **Dev de LP** — integra o script em < 5 minutos
- **AdOps** — monitora qualidade dos dados (sessionId, block_id, UTMs)
- **Media buyers** — dependem dos dados para regras de conversão no pipeline

### O que torna especial

- Instalação via script tag same-domain (2 linhas + stub opcional)
- Session management com TTL 5min e persistência em cookie
- Atribuição de mídia paga (UTMs + click-ids) persistida na sessão
- Entrega resiliente: batching, retry, persistência em localStorage, flush on unload
- Schema ad-tech (`block_id`, `block_position`, `ad_request_id`) como propriedades de evento

---

## Success Criteria

| Métrica | Target | Como medir |
|---------|--------|------------|
| Taxa de captura | ≥ 97% | Eventos enviados vs recebidos pelo Collector (amostra por session) |
| Tempo de instalação | < 5 min | Teste com dev novo no SDK |
| Bundle size | ≤ 30 KB gzip | `size-limit` no CI (atual medido: `dist/umd/sdk.min.js` ~30,1 KiB gzip; `script/sdk.min.js` ~29,8 KiB gzip) |
| Impacto no LCP | < 50 ms | Lighthouse antes/depois |
| Session coverage | ≥ 99% | % eventos com `context.sessionId` não-vazio |
| Retry success | ≥ 95% | Reentregas após falha inicial |

---

## API Pública

**Global principal:** `window.analytics`. `window.ConversionAnalytics`, `_analytics` e
`_ConversionAnalytics` permanecem como aliases para compatibilidade.

| Método | Assinatura | Descrição |
|--------|-----------|-----------|
| `init` | `init(config: AnalyticsInitConfig)` | Inicializa SDK, registra plugins, inicia fila |
| `track` | `track(event, properties?, options?)` | Evento customizado |
| `page` | `page(properties?, options?)` | Page view |
| `identify` | `identify(userOrTraits, traits?, options?)` | Associa usuário; PII hasheada no Collector ou enrichment opcional |
| `flush` | `flush()` | Flush manual da fila |
| `start` | `start()` | Carrega bundle async (stub pattern) |
| `getDebugInfo` | `getDebugInfo()` | `sessionId`, `endpoint`, `queueSize`, `lastError` |
| `getQueueSize` | `getQueueSize()` | Tamanho da fila pendente |

### Comportamentos automáticos

- `page` automático no bootstrap (salvo se enfileirado no stub)
- Session management — geração, persistência, renovação (5min inatividade)
- Captura de query params na primeira página → replica em eventos da sessão
- Batching — flush por tamanho (10) ou intervalo (2s)
- Flush on unload — `visibilitychange` (hidden) + `pagehide` via `sendBeacon`
- Retry com backoff exponencial + jitter
- Persistência em `localStorage` quando envio falha

### Instalação

```html
<script src="/assets/sdk.min.js"></script>
<script>
  analytics.init({
    endpoint: '/collect',
    appName: 'my-landing-page',
  });
</script>
```

Ver [../conversion-pipeline.md](../conversion-pipeline.md) para stub async.

---

## Functional Requirements

### Inicialização & Configuração

| ID | Requisito | Status |
|----|-----------|--------|
| FR1 | SDK inicializa via `init(config)` com endpoint e opções | ✅ |
| FR2 | Config em runtime via objeto `init()` (MVP); writeKey remoto é Phase 2 | ✅ MVP |
| FR3 | Plugins customizados registrados automaticamente no bootstrap | ✅ |
| FR4 | Objeto global `window.ConversionAnalytics` | ✅ |

### Captura de Eventos

| ID | Requisito | Status |
|----|-----------|--------|
| FR5 | `track()` para eventos ad-tech com propriedades | ✅ |
| FR6 | `page()` para page views | ✅ |
| FR7 | Auto `page` na inicialização | ✅ |
| FR8 | UTMs extraídos em `context.campaign`; promoção para `properties`/`query_params` quando page enrichment está ativo | ✅ |
| FR9 | Click-ids (`gclid`, `fbclid`, `ttclid`, etc.) capturados em `context.campaign` | ✅ |
| FR10 | `identify()` envia traits; hash ocorre no Collector ou no enrichment opcional | ✅ |
| FR11 | Campos ad-tech em `properties` quando fornecidos | ✅ |

### Session Management

| ID | Requisito | Status |
|----|-----------|--------|
| FR12 | `sessionId` UUID v4 gerado client-side | ✅ |
| FR13 | Persistido em cookie (`_utua_session`) com fallback em localStorage (`utua_session`) | ✅ |
| FR14 | Renovado enquanto houver atividade dentro de 5min | ✅ |
| FR15 | Nova sessão após expiração por inatividade | ✅ |
| FR16 | Injetado em `context.sessionId` de todos os eventos | ✅ |

### Transporte & Entrega

| ID | Requisito | Status |
|----|-----------|--------|
| FR17 | Batching antes do envio | ✅ |
| FR18 | Flush on unload (`visibilitychange` + `pagehide`) | ✅ |
| FR19 | Persistência em localStorage em falha | ✅ |
| FR20 | Retry com backoff exponencial | ✅ |
| FR21 | POST para endpoint configurável (default `/collect`) | ✅ |
| FR22 | Payload array nativo analytics-next — ver [backend-contract.md](./backend-contract.md) | ✅ |

### Distribuição & Build

| ID | Requisito | Status |
|----|-----------|--------|
| FR23 | Bundle UMD único via script tag | ✅ |
| FR24 | Browsers modernos (últimas 2 versões, ES2017+) | ✅ |
| FR25 | Next.js client-side (`use client`, dynamic import) | ✅ |

### Coexistência

| ID | Requisito | Status |
|----|-----------|--------|
| FR26 | Independente do GTM e pixels existentes | ✅ |
| FR27 | Não lê/escreve `dataLayer` | ✅ |
| FR28 | Sem interferência na ordem de carregamento de scripts | ✅ |

---

## Non-Functional Requirements

### Performance

| ID | Requisito | Status |
|----|-----------|--------|
| NFR1 | Bundle ≤ 30 KB gzip | ⚠️ No limite: `dist/umd/sdk.min.js` ~30,1 KiB gzip; `script/sdk.min.js` ~29,8 KiB gzip |
| NFR2 | LCP impact < 50 ms | ⚠️ Não medido no CI |
| NFR3 | `track()` / `page()` < 1 ms (fire-and-forget) | ✅ |
| NFR4 | Flush on unload via `sendBeacon` (+ keepalive fallback) | ✅ |

### Reliability

| ID | Requisito | Status |
|----|-----------|--------|
| NFR5 | Captura ≥ 97% | ⚠️ Requer validação em produção |
| NFR6 | Session coverage ≥ 99% | ⚠️ Requer validação em produção |
| NFR7 | Retry success ≥ 95% | ⚠️ Requer validação em produção |
| NFR8 | Sem perda em navegação normal (reload, tab switch) | ✅ |
| NFR9 | Opera com Collector offline (acumula em LS) | ✅ |
| NFR10 | Falha em destination plugin não para o pipeline | ✅ |

### Security

| ID | Requisito | Status |
|----|-----------|--------|
| NFR11 | PII não logada no console; hash feito no Collector ou no enrichment opcional | ✅ |
| NFR12 | Envio apenas para endpoint configurado | ✅ |
| NFR13 | Cookie session com `SameSite=Lax` + `Secure` (HTTPS) | ✅ |

### Integration

| ID | Requisito | Status |
|----|-----------|--------|
| NFR14 | Payload compatível com `normalize()` do Collector | ✅ — ver backend-contract |
| NFR15 | Plugin pipeline analytics-next sem monkey-patch | ✅ |
| NFR16 | Sem conflitos com GTM / pixels | ✅ |
| NFR17 | `sessionId` UUID v4 sem transformação server-side | ✅ |

---

## Phase 2 (fora do MVP)

- Configuration Server (`GET /config/{writeKey}`)
- Config por domínio/país
- Toggle de plugins via config remota
- Métricas de delivery do SDK (meta-eventos)
- Wrapper oficial Next.js / React
- Namespace configurável (`globalName`)

## Known gaps antes de chamar de 100%

- Métricas de produção ainda precisam comprovar captura ≥97%, session coverage ≥99%, retry success ≥95% e impacto no LCP <50ms.
- O bundle está sem folga real contra o alvo de 30KB gzip; qualquer feature nova precisa vir com otimização ou medição.
- O Collector Go em produção precisa aceitar o contrato nativo (`[CollectEvent, ...]`, camelCase, `context.sessionId`) ou receber tradução por proxy same-origin durante a migração.
- Testes ainda podem cobrir melhor persistência offline após reload, sucesso real de `sendBeacon`, `visibilitychange`, todos os click-ids e contrato completo do global exposto.

## Phase 3

- Multi-collector routing
- A/B testing de configuração
- Consent management integrado (LGPD/GDPR)
- SDK auto-update via config server
