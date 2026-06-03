# Rollout Plan and Legacy Fallback

> **Note:** The standalone `conversion-analytics-sdk` wrapper was consolidated into the
> analytics-next fork. Distribution is **static script only** — see
> [DISTRIBUTING-STATIC-SDK.md](../DISTRIBUTING-STATIC-SDK.md).

## Objetivo

Migrar gradualmente do oneControl/growthcontrol para a nova SDK sem risco de perda de tracking.

## Estratégia de rollout

1. **Shadow mode em ambiente de teste**
   - Inicializar a nova SDK e disparar eventos em paralelo com o legado.
   - Comparar volume por evento e payload mínimo obrigatório.

2. **Feature flag por projeto/país**
   - Chave recomendada: `useNewConversionAnalytics`.
   - Ativar inicialmente em 5-10% dos projetos.

3. **Canary no QuizBuilder**
   - Trocar wrapper para usar `window.ConversionAnalytics` da nova SDK (deixar `window.Analytics` livre para oneControl/outras libs).
   - Monitorar taxa de sucesso do `/collector` e tamanho médio da fila local.

4. **Expansão para WordPress**
   - Publicar snippet padrão com `init + attachToWindow`.
   - Validar debug info (`sessionId`, `endpoint`) em páginas reais.

5. **Desligamento gradual do legado**
   - Remover oneControl por cluster após estabilidade de 7 dias.

## Fallback imediato

Se houver regressão:

- Desativar feature flag `useNewConversionAnalytics`.
- Restaurar wrapper antigo (legado em `window.Analytics` / oneControl).
- Reprocessar logs de erro e retomar canary após correção.

## Checklist de validação por etapa

- [ ] `track` e `identify` chegam ao `/collector`
- [ ] `session_id` presente no contexto dos eventos
- [ ] sem aumento anormal de erros de rede
- [ ] sem impacto perceptível na performance da página
