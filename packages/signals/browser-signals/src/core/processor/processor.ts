import { logger } from '../../lib/logger'
import { replaceBaseUrl } from '../../lib/replace-base-url'
import { Signal } from '../../types'
import { AnalyticsService } from '../analytics-service'
import { MethodName, Sandbox, SandboxSettingsConfig } from './sandbox'

interface SignalEventProcessorSettingsConfig {
  processSignal?: string
  functionHost?: string
}
export class SignalEventProcessor {
  private sandbox: Sandbox
  private analyticsService: AnalyticsService
  constructor(
    analyticsService: AnalyticsService,
    settings: SignalEventProcessorSettingsConfig = {}
  ) {
    this.analyticsService = analyticsService
    this.sandbox = new Sandbox(
      createSandboxSettings({
        ...settings,
        edgeFnDownloadURL: analyticsService.edgeFnSettings?.downloadURL,
      })
    )
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

const createSandboxSettings = (settings: {
  processSignal?: string
  functionHost?: string
  edgeFnDownloadURL?: string
}): SandboxSettingsConfig => {
  if (!settings.edgeFnDownloadURL && !settings.processSignal) {
    throw new Error('one of: edgeFnDownloadUrl or processSignal is required')
  }

  const normalizedEdgeFn =
    settings.functionHost && settings.edgeFnDownloadURL
      ? replaceBaseUrl(
          settings.edgeFnDownloadURL,
          `https://${settings.functionHost}`
        )
      : settings.edgeFnDownloadURL
  return {
    edgeFnDownloadUrl: normalizedEdgeFn!,
    processSignal: settings.processSignal,
  }
}
