import { logger } from '../../lib/logger'
import { Signal } from '@segment/analytics-signals-runtime'
import { AnyAnalytics } from '../../types'
import { AnalyticsMethodCalls, MethodName, SignalSandbox } from './sandbox'

export class SignalEventProcessor {
  analytics: AnyAnalytics
  sandbox: SignalSandbox
  constructor(analytics: AnyAnalytics, sandbox: SignalSandbox) {
    this.analytics = analytics
    this.sandbox = sandbox
  }

  async process(signal: Signal, signals: Signal[]) {
    let analyticsMethodCalls: AnalyticsMethodCalls | undefined
    try {
      analyticsMethodCalls = await this.sandbox.execute(signal, signals)
    } catch (err) {
      // in practice, we should never hit this error, but if we do, we should log it.
      console.error('Error processing signal', { signal, signals }, err)
      return
    }

    for (const methodName in analyticsMethodCalls) {
      const name = methodName as MethodName
      const eventsCollection = analyticsMethodCalls[name]
      eventsCollection.forEach((args) => {
        logger.info('New method call:', `analytics.${name}()`, args)

        // @ts-ignore
        this.analytics[name](...args)
      })
    }
  }

  cleanup() {
    return this.sandbox.destroy()
  }
}
