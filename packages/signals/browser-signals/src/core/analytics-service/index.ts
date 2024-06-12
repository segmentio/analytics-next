import { AnyAnalytics } from '../../types'
import { SignalGenerator } from '../signal-generators/types'

/**
 * Helper / facade that wraps the analytics, and abstracts away the details of the analytics instance.
 */
export class AnalyticsService {
  private instance: AnyAnalytics
  constructor(analyticsInstance: AnyAnalytics) {
    this.instance = analyticsInstance
  }
  get writeKey() {
    return this.instance.settings.writeKey
  }
  createSegmentInstrumentationEventGenerator(): SignalGenerator {
    let disable = false
    const generator: SignalGenerator = {
      id: 'segment-event-generator',
      register: async (signalEmitter) => {
        await this.instance.addSourceMiddleware(({ payload, next }) => {
          if (disable) {
            return
          }
          const event = payload.obj

          const isEventFromSignalEdgeFunction =
            event.context.__eventOrigin?.type === 'Signal'

          if (!isEventFromSignalEdgeFunction) {
            signalEmitter.emit({
              type: 'instrumentation',
              data: event,
            })
          }

          return next(payload)
        })
        return () => {
          disable = true
        }
      },
    }
    return generator
  }
}
