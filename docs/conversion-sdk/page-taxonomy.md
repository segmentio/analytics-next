# URL taxonomy (`page` event)

Espelha a lógica em `src/context/page-taxonomy.ts` para Eng Dados (fallback em ED-3).

## Padrão

Primeiro segmento do `pathname` (sem barras iniciais/finais):

```text
/<country>-<vertical>-<product>-<funnel>/...
```

Exemplo:

```text
/usa-cc-mastercardbuilt-p1
  → country = "usa"
  → vertical = "cc"
  → product = "mastercardbuilt"
  → funnel = "p1"
```

## Mais de quatro partes (hífen no `product`)

Quando o primeiro segmento tem **mais de quatro** partes separadas por `-`:

- `country` = primeira parte
- `vertical` = segunda parte
- `funnel` = última parte
- `product` = partes do meio unidas com `-`

Exemplo:

```text
/usa-cc-master-card-built-p1
  → country = "usa"
  → vertical = "cc"
  → product = "master-card-built"
  → funnel = "p1"
```

## Sem match

Paths que não seguem o padrão (ex.: `/`, `/blog/article-x`, `/quiz`) enviam os quatro campos vazios (`""`). A SDK **não** lança erro.

## Campos no `page`

| Campo | Origem |
| --- | --- |
| `page_path` | `window.location.pathname` |
| `visitor_country` | `init({ getVisitorCountry })` ou região de `navigator.language` (ex. `pt-BR` → `BR`) |
| `country`, `vertical`, `product`, `funnel` | Parser acima (não confundir `country` com `visitor_country`) |
