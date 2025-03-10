// @ts-ignore
import * as tsub from '../../vendor/tsub/tsub'
import type { Matcher, Rule, Store } from '../../vendor/tsub/types'
import { DestinationMiddlewareFunction } from '../middleware'

// TODO: update tsub definition
type RoutingRuleMatcher = Matcher & {
  config?: {
    expr: string
  }
}

export type RoutingRule = Rule & {
  matchers: RoutingRuleMatcher[]
}

export const tsubMiddleware =
  (rules: RoutingRule[]): DestinationMiddlewareFunction =>
  ({ payload, integration, next }): void => {
    const store = new tsub.Store(rules) as Store
    const rulesToApply = store.getRulesByDestinationName(integration)

    rulesToApply.forEach((rule: Rule) => {
      const { matchers, transformers } = rule

      for (let i = 0; i < matchers.length; i++) {
        if (tsub.matches(payload.obj, matchers[i])) {
          payload.obj = tsub.transform(payload.obj, transformers[i])

          if (payload.obj === null) {
            return next(null)
          }
        }
      }
    })

    next(payload)
  }
