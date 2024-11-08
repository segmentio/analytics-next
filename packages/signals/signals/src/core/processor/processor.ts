import { logger } from '../../lib/logger'
import { Signal } from '@segment/analytics-signals-runtime'
import { AnyAnalytics } from '../../types'
import { MethodName, Sandbox } from './sandbox'

export class SignalEventProcessor {
  private sandbox: Sandbox
  private analytics: AnyAnalytics
  constructor(analytics: AnyAnalytics, sandbox: Sandbox) {
    this.analytics = analytics
    this.sandbox = sandbox
  }

  async process(signal: Signal, signals: Signal[]) {
    const analyticsMethodCalls = await this.sandbox.process(signal, signals)

    for (const methodName in analyticsMethodCalls) {
      const name = methodName as MethodName
      const eventsCollection = analyticsMethodCalls[name]
      eventsCollection.forEach((args) => {
        logger.info('New signals-originated event:', name, { args })

        // @ts-ignore
        this.analytics[name](...args)
      })
    }
  }

  cleanup() {
    return this.sandbox.jsSandbox.destroy()
  }
}
