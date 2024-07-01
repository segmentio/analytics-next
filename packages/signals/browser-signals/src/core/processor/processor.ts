import { logger } from '../../lib/logger'
import { Signal } from '../../types'
import { AnalyticsService } from '../analytics-service'
import { MethodName, Sandbox } from './sandbox'

export class SignalEventProcessor {
  private sandbox: Sandbox
  private analyticsService: AnalyticsService
  constructor(analyticsService: AnalyticsService, sandbox: Sandbox) {
    this.analyticsService = analyticsService
    this.sandbox = sandbox
  }

  async process(signal: Signal, signals: Signal[]) {
    const analyticsMethodCalls = await this.sandbox.process(signal, signals)
    logger.debug('New signal processed. Analytics method calls:', {
      methodArgs: analyticsMethodCalls,
    })

    for (const methodName in analyticsMethodCalls) {
      const name = methodName as MethodName
      const eventsCollection = analyticsMethodCalls[name]
      eventsCollection.forEach((args) => {
        // @ts-ignore
        this.analyticsService.instance[name](...args)
      })
    }
  }

  cleanup() {
    return this.sandbox.jsSandbox.destroy()
  }
}
