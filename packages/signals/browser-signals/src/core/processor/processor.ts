import { logger } from '../../lib/logger'
import { AnyAnalytics, CDNSettings, Signal } from '../../types'
import { MethodName, Sandbox, SandboxSettingsConfig } from './sandbox'

interface SignalEventProcessorSettingsConfig {
  edgeFnOverride?: string
}
export class SignalEventProcessor {
  private sandbox: Sandbox
  private analytics: AnyAnalytics
  constructor(
    analytics: AnyAnalytics,
    settings: SignalEventProcessorSettingsConfig = {}
  ) {
    this.analytics = analytics
    this.sandbox = new Sandbox(createSandboxSettings(settings, analytics))
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
        this.analytics[name](...args)
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
  const edgeFnDownloadUrl = settings.edgeFnOverride
    ? undefined
    : parseDownloadURL(analytics.settings.cdnSettings)

  if (!edgeFnDownloadUrl && !settings.edgeFnOverride) {
    throw new Error('one of: edgeFnDownloadUrl or edgeFnOverride is required')
  }
  return {
    edgeFnDownloadUrl: edgeFnDownloadUrl!, // Config is a union type, so we need to assert that it's not undefined
    edgeFnOverride: settings.edgeFnOverride,
  }
}
