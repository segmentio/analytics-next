import { CDNSettings } from '@segment/analytics-next'
import { AnyAnalytics, createInstrumentationSignal } from '../../types'
import { SignalGenerator } from '../signal-generators/types'

type EdgeFunctionSettings = { downloadURL: string; version?: number }

/**
 * Helper / facade that wraps the analytics, and abstracts away the details of the analytics instance.
 */
export class AnalyticsService {
  instance: AnyAnalytics
  edgeFnSettings?: EdgeFunctionSettings
  constructor(analyticsInstance: AnyAnalytics) {
    this.instance = analyticsInstance
    this.edgeFnSettings = this.parseEdgeFnSettings(
      analyticsInstance.settings.cdnSettings
    )
  }

  private parseEdgeFnSettings(
    cdnSettings: CDNSettings
  ): EdgeFunctionSettings | undefined {
    const edgeFnSettings = cdnSettings.edgeFunction
    if (edgeFnSettings && 'downloadURL' in edgeFnSettings) {
      return edgeFnSettings
    }
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
            signalEmitter.emit(createInstrumentationSignal(event))
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
