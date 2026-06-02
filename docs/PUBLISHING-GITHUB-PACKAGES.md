# Publicando o fork no GitHub Packages (`@be-growth/analytics-next`)

Este fork é consumido pelo `conversion-analytics-sdk` como package npm privado, via
**GitHub Packages**. O package publicado é o **browser** (`packages/browser`), que já
exporta a `conversionCollectorPlugin` — então o artefato publicado leva a plugin junto.

## Por que "rename só no publish"?

O GitHub Packages exige que o **scope** do package bata com o dono do repositório
(`be-growth`). O package no monorepo se chama `@segment/analytics-next`. Em vez de
renomear no fonte — o que quebraria ~13 imports (consent, test-helpers, playgrounds)
e geraria conflito a cada sync com o upstream `segmentio/analytics-next` — o
[`scripts/publish-github-package.cjs`](../scripts/publish-github-package.cjs) reescreve
**apenas o manifesto publicado** (`name`, `repository`, `publishConfig`) e restaura o
`package.json` original logo após. O fonte continua intocado.

As deps de runtime (`@segment/analytics-core@1.8.3`, `@segment/analytics-generic-utils@1.2.0`, …)
são versões fixas resolvidas do **npm público** e estão inalteradas vs upstream — nada a reescrever.

## Pré-requisitos (uma vez)

### 1. Criar o Personal Access Token

- Acesse https://github.com/settings/tokens/new (classic)
- **Scopes:** `write:packages` + `repo`
- **Generate** → copie o valor (`ghp_…`)
- Na lista de tokens (https://github.com/settings/tokens), clique **Configure SSO** →
  **Authorize** para o org **`be-growth`** (sem isso o publish retorna 401/403)

> Alternativa fine-grained: https://github.com/settings/personal-access-tokens/new →
> Resource owner = `be-growth` → **Contents: Read** + **Packages: Read and write** (requer aprovação de um owner do org).

### 2. Exportar o token

```bash
export GITHUB_PACKAGES_TOKEN=ghp_xxxxxxxxxxxx
```

O [`.npmrc`](../.npmrc) já referencia essa variável — **nunca** cole o token no arquivo.

## Publicar

```bash
yarn install          # se ainda não instalou
yarn publish:gh       # builda o browser + publica @be-growth/analytics-next
```

Validar antes sem subir nada:

```bash
DRY_RUN=1 yarn workspace @segment/analytics-next build && DRY_RUN=1 node scripts/publish-github-package.cjs
```

Versão própria do fork (opcional, evita confusão com o upstream):

```bash
BG_PACKAGE_VERSION=1.84.0-bg.1 yarn publish:gh
```

Confirme em: **https://github.com/orgs/be-growth/packages**

## Consumir (no `conversion-analytics-sdk`)

`.npmrc` do projeto consumidor:

```
@be-growth:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

```bash
npm install @be-growth/analytics-next
```

> Para consumir basta um token com `read:packages` (+ `repo`). Para CI/Docker, injete o
> token como secret/build-arg (mesmo padrão do `TECH_UTUA_GITHUB_TOKEN` usado nos serviços Go).
