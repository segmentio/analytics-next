import { logger } from '../../lib/logger'
import { AnyAnalytics, CDNSettings, Signal } from '../../types'
import { Sandbox } from './sandbox'

const parseDownloadURL = (cdnSettings: CDNSettings) => {
  if (
    !cdnSettings.edgeFunction ||
    !('downloadURL' in cdnSettings.edgeFunction)
  ) {
    throw new Error('Edge function settings are not defined')
  } else {
    return cdnSettings.edgeFunction.downloadURL
  }
}

interface SignalEventProcessorSettings {
  edgeFn?: string
}
export class SignalEventProcessor {
  private sandbox: Sandbox
  private analytics: AnyAnalytics
  constructor(
    analytics: AnyAnalytics,
    settings: SignalEventProcessorSettings = {}
  ) {
    this.analytics = analytics
    this.sandbox = new Sandbox({
      edgeFnDownloadUrl: parseDownloadURL(analytics.settings.cdnSettings),
      edgeFn: settings.edgeFn,
    })
  }
  async process(signal: Signal, signals: Signal[]) {
    const events = await this.sandbox.process(signal, signals)
    logger.debug('procsessed events.', events)

    Object.keys(events).forEach((eventName) => {
      // @ts-ignore
      this.analytics[eventName](...events[eventName])
    })
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
