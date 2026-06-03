# Distribuição estática do SDK (script tag)

O SDK de coleta do Conversion Pipeline é distribuído **apenas como arquivo JavaScript estático** —
não publicamos npm / GitHub Packages. O fluxo é o mesmo do antigo `conversion-analytics-sdk`:
build local → copiar o bundle para o origin da LP (same-domain).

## Build

```bash
cd analytics-next/packages/browser
yarn install   # na raiz do monorepo, se necessário
yarn build:conversion-sdk
```

Isso gera:

| Artefato | Descrição |
|----------|-----------|
| `dist/umd/sdk.min.js` | **Produção** — usar em LPs (`/assets/sdk.min.js`) |
| `dist/umd/conversion-analytics.build.min.js` | Minificado (mesmo conteúdo que `sdk.min.js`) |
| `dist/umd/conversion-analytics.build.js` | Debug (legível, com source map) |
| `script/*` | Espelho versionado no repo (GitHub Pages / referência) |

Aliases legados em `script/` (compatibilidade com URLs antigas):

- `conversion-analytics-sdk.build.min.js` → cópia de `sdk.min.js`
- `conversion-analytics-sdk.build.js` → cópia do bundle legível

Atualizar só o espelho em `script/` após build:

```bash
yarn sync:script
```

## Deploy na landing page (same-domain)

1. Copie `dist/umd/sdk.min.js` para o CDN/origin da LP, ex.: `/assets/sdk.min.js`
2. Configure o reverse proxy de `/collect` (ou endpoint configurado) para o Collector
3. Cole o snippet na LP (ver [conversion-pipeline.md](./conversion-pipeline.md))

**Requisito:** script e endpoint de coleta no **mesmo domínio** (evita ad blockers e ITP).

## GitHub Pages (opcional)

Se o repo `analytics-next` publicar a pasta `script/` via GitHub Pages, a URL pública fica:

```
https://<org>.github.io/<repo>/script/sdk.min.js
```

Em produção, prefira same-domain na LP em vez de third-party CDN.

## CI

Exemplo mínimo:

```yaml
- run: yarn workspace @segment/analytics-next build:conversion-sdk
- uses: actions/upload-artifact@v4
  with:
    name: conversion-sdk
    path: |
      analytics-next/packages/browser/dist/umd/sdk.min.js
      analytics-next/script/
```

## O que não usamos

- GitHub Packages / `@be-growth/analytics-next` npm install
- Segment CDN / `writeKey` remoto

O monorepo mantém `@segment/analytics-next` apenas como workspace interno para desenvolvimento e testes.
