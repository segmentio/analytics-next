# PII hashing e consentimento (FE-2)

## O que a SDK faz no `identify`

Antes do envio ao collector, traits sensíveis são normalizados em `normalizeIdentifyTraits`:

| Trait | Tratamento |
| --- | --- |
| `email` | lowercase + trim → SHA-256 hex (64 chars). Duplicado em `email_hash` para schema BE. |
| `phone` (e aliases `whatsapp`, `telefone`, `mobile`) | E.164 (default país `55`) → SHA-256. Duplicado em `phone_hash` quando aplicável. |
| `email_domain` | Mantido em **claro** (derivado do email ou enviado pelo host). |
| `name` | SHA-256 (lowercase + trim). |

Valores que já estão em formato SHA-256 hex não são re-hasheados.

## Consentimento

O uso de PII hasheada no pipeline assume **consentimento explícito** no fluxo do produto (política de privacidade + termos no **Quiz Completed**, com flags como `optin_email`).

A SDK **não** implementa banner de consentimento nem bloqueio por finalidade: o host deve usar `init({ isTrackingAllowed })` / DNT conforme LGPD/GDPR.

Eng Dados deriva sinais de consentimento a partir do evento `Quiz Completed` (ver ED-12 no plano de execução). Não há evento dedicado de consent na SDK (FE-8).

## Verificação manual

1. `identify` com `email: "user@example.com"`.
2. No Network tab, `traits.email` e `traits.email_hash` devem ser o mesmo hash de 64 caracteres hex.
3. O mesmo email normalizado deve gerar o **mesmo** hash em sessões/dispositivos diferentes.
