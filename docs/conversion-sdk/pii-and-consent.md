# PII hashing e consentimento

## `user_id` no `identify` (BGID / SHA-256 do email)

`ConversionClient.identify()` (`packages/browser/src/conversion-sdk/conversion-client.ts`) sempre
resolve um `user_id` antes de enviar o evento, mesmo quando o chamador não passa um explícito:

1. Se o chamador passar `userId` (ex.: BGID vindo de `arbgid.com.br`/`id.utua.com.br`), ele é usado.
2. Senão, se `traits.bgid` (ou `bgId`/`BGID`) estiver presente, ele é usado.
3. Senão, deriva `user_id = SHA-256(trim(lowercase(traits.email)))` — sem secret, determinístico
   entre devices/sessões diferentes.
4. Se não houver nenhuma das opções acima, o evento vai sem `user_id` (não há PII para derivar).

A lógica vive em `packages/browser/src/conversion-sdk/identity.ts` (`deriveUserIdFromTraits`).
Isso corrige o bug em que `identify` com email nas traits mas sem `userId` explícito chegava ao
Collector com `user_id` vazio.

## `traits.navec` (origem dos dados)

Todo `identify()` marca as traits com `traits.navec = { source: "<navecSource>" }` (default
`"conversion-pipeline-sdk"`, configurável via `init({ navecSource })`), a menos que o chamador já
tenha passado `traits.navec` explicitamente. Quando `lotameClientId` está configurado, um marcador
equivalente `traits.lotame = { source: "lotame", clientId }` também é adicionado. Isso chega ao
ClickHouse dentro da coluna `traits` (JSON), sem necessidade de mudança no backend.

> A estrutura `{ source }` é um placeholder — o schema exato ainda precisa ser confirmado com o
> Misságia (pedido original não especificou o formato).

## O que acontece no `identify`

Por default, a SDK envia os `traits` no payload nativo analytics-next e o Collector normaliza/hasheia
os campos sensíveis antes de persistir. A SDK também possui o enrichment opcional
`enableIdentifyHashing`, que aplica `normalizeIdentifyTraits` antes do envio quando habilitado.

| Trait | Tratamento |
| --- | --- |
| `email` | lowercase + trim → SHA-256 hex (64 chars). Pode ser duplicado em `email_hash` para schema BE. |
| `phone` (e aliases `whatsapp`, `telefone`, `mobile`) | E.164 (default país `55`) → SHA-256. Pode ser duplicado em `phone_hash` quando aplicável. |
| `email_domain` | Mantido em **claro** (derivado do email ou enviado pelo host). |
| `name` | SHA-256 (lowercase + trim). |

Valores que já estão em formato SHA-256 hex não são re-hasheados pelo enrichment opcional nem pelo
Collector de referência.

## Consentimento

O uso de PII hasheada no pipeline assume **consentimento explícito** no fluxo do produto (política de privacidade + termos no **Quiz Completed**, com flags como `optin_email`).

A SDK **não** implementa banner de consentimento nem bloqueio por finalidade: o host deve usar `init({ isTrackingAllowed })` / DNT conforme LGPD/GDPR.

Eng Dados deriva sinais de consentimento a partir do evento `Quiz Completed` (ver ED-12 no plano de execução). Não há evento dedicado de consent na SDK (FE-8).

## Verificação manual

1. Com `enableIdentifyHashing: false` ou ausente, `identify` com `email: "user@example.com"` pode
   aparecer em claro no Network tab; o hash deve ser validado no Collector/ClickHouse.
2. Com `enableIdentifyHashing: true`, `traits.email` e `traits.email_hash` devem ser o mesmo hash de
   64 caracteres hex no Network tab.
3. O mesmo email normalizado deve gerar o **mesmo** hash em sessões/dispositivos diferentes.
