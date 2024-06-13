import { logger } from '../../lib/logger'
import { AnyAnalytics, CDNSettings, Signal } from '../../types'
import { MethodName, Sandbox, SandboxSettingsConfig } from './sandbox'

interface SignalEventProcessorSettingsConfig {
  processSignal?: string
}
export class SignalEventProcessor {
  private sandbox: Sandbox
  private hostAnalytics: AnyAnalytics
  constructor(
    hostAnalytics: AnyAnalytics,
    settings: SignalEventProcessorSettingsConfig = {}
  ) {
    this.hostAnalytics = hostAnalytics
    this.sandbox = new Sandbox(createSandboxSettings(settings, hostAnalytics))
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
        this.hostAnalytics[name](...args)
      })
    }
  }

  cleanup() {
    return this.sandbox.jsSandbox.destroy()
  }
}

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

const createSandboxSettings = (
  settings: SignalEventProcessorSettingsConfig,
  analytics: AnyAnalytics
): SandboxSettingsConfig => {
  const edgeFnDownloadUrl = settings.processSignal
    ? undefined
    : parseDownloadURL(analytics.settings.cdnSettings)

  if (!edgeFnDownloadUrl && !settings.processSignal) {
    throw new Error('one of: edgeFnDownloadUrl or processSignal is required')
  }
  return {
    edgeFnDownloadUrl: edgeFnDownloadUrl!, // Config is a union type, so we need to assert that it's not undefined
    processSignal: settings.processSignal,
  }
}
