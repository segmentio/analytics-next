import { logger } from '../../lib/logger'
import { AnyAnalytics, CDNSettings, Signal } from '../../types'
import { MethodName, Sandbox } from './sandbox'

const parseDownloadURL = (cdnSettings: CDNSettings): string | undefined => {
  if (
    cdnSettings.edgeFunction &&
    'downloadURL' in cdnSettings.edgeFunction &&
    typeof cdnSettings.edgeFunction.downloadURL === 'string'
  ) {
    return cdnSettings.edgeFunction.downloadURL
  } else {
    return undefined
  }
}

const createSignalsEventProcessorInternalSettings = (
  settings: SignalEventProcessorSettingsConfig,
  analytics: AnyAnalytics
) => {
  const edgeFnDownloadUrl = settings.edgeFnOverride
    ? undefined
    : parseDownloadURL(analytics.settings.cdnSettings)

  console.log(settings.edgeFnOverride)
  return {
    edgeFnDownloadUrl: edgeFnDownloadUrl,
    edgeFnOverride: settings.edgeFnOverride,
  }
}

interface SignalEventProcessorSettingsConfig {
  edgeFnOverride?: string
}
export class SignalEventProcessor {
  private sandbox: Sandbox
  private analytics: AnyAnalytics
  private settings: ReturnType<
    typeof createSignalsEventProcessorInternalSettings
  >
  constructor(
    analytics: AnyAnalytics,
    settings: SignalEventProcessorSettingsConfig = {}
  ) {
    this.analytics = analytics
    this.settings = createSignalsEventProcessorInternalSettings(
      settings,
      analytics
    )
    this.sandbox = new Sandbox({
      edgeFnDownloadUrl: this.settings.edgeFnDownloadUrl!,
      edgeFnOverride: this.settings.edgeFnOverride,
    })
  }
  async process(signal: Signal, signals: Signal[]) {
    const bufferedEventMethods = await this.sandbox.process(signal, signals)
    logger.debug('processed events.', { args: bufferedEventMethods })
    for (const methodName in bufferedEventMethods) {
      const name = methodName as MethodName
      const eventsCollection = bufferedEventMethods[name]
      eventsCollection.forEach((args) => {
        this.analytics[name].apply(this.analytics[name], args)
      })
    }
  }
}
//    class SignalsEventProcessor {
//     private sandbox: Sandbox
//     private signalsRuntime: SignalsRuntime
//     constructor(public analyticsInstance: Analytics) {
//         this.sandbox = new Sandbox(analyticsInstance.cdnSettings.edgeFn)
//         this.signalsRuntime = new SignalsRuntime(new SignalBuffer())
//     }

//     process(signal: Signal) {
//         // todo: think about loop protection
//         const events = await this.sandbox.process(signal)
//         // proxy arguments to real analytics instance
//         Object.keys(events).forEach((eventName) => this.analyticsInstance[eventName](events[eventName]))
//     }

//     cleanup() {
//       this.sandbox.destroy()
// }
// }

//      class Sandbox {
//     	edgeFn: Promise<string>
//     	jsSandbox = createWorkerBox()
//        signalsRuntime: Signals

//        constructor(edgeFnDownloadURL: URL, signals: Signals) {
//           this.edgeFn = fetch(edgeFnDownloadURL).then(res => res.text())
//        }

//     async process(signal: Signal): SegmentEvents => {
//         const scope = {
//             Signals: this.signalsRuntime,
//             analytics: new AnalyticsStub(),
//             processSignal: await edgeFn,
//         }

//         await this.sandbox.run("processSignal(" + JSON.stringify(signal) + ");", scope)
//         return analyticsStub.events
//     }

//     cleanup() {
//         return this.jsSandbox.destroy()
//     }
// }
