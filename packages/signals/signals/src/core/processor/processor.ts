import { logger } from '../../lib/logger'
import { Signal } from '@segment/analytics-signals-runtime'
import { AnyAnalytics } from '../../types'
import { AnalyticsMethodCalls, MethodName, Sandbox } from './sandbox'

export class SignalEventProcessor {
  private sandbox: Sandbox
  private analytics: AnyAnalytics
  constructor(analytics: AnyAnalytics, sandbox: Sandbox) {
    this.analytics = analytics
    this.sandbox = sandbox
  }

  async process(signal: Signal, signals: Signal[]) {
    let analyticsMethodCalls: AnalyticsMethodCalls
    try {
      analyticsMethodCalls = await this.sandbox.process(signal, signals)
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
    return this.sandbox.jsSandbox.destroy()
  }
}
