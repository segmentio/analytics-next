import { parseDebugModeQueryString } from '../debug-mode'
import { logger } from '../../lib/logger'
import { SignalBufferSettingsConfig, SignalPersistentStorage } from '../buffer'
import { SignalsIngestSettingsConfig } from '../client'
import { SandboxSettingsConfig } from '../processor/sandbox'
import { NetworkSettingsConfig } from '../signal-generators/network-gen'
import { SignalsPluginSettingsConfig } from '../../types'

export type SignalsSettingsConfig = Pick<
  SignalsPluginSettingsConfig,
  | 'maxBufferSize'
  | 'apiHost'
  | 'functionHost'
  | 'flushAt'
  | 'flushInterval'
  | 'enableSignalsDebug'
  | 'networkSignalsAllowList'
  | 'networkSignalsDisallowList'
  | 'networkSignalsAllowSameDomain'
> & {
  signalStorage?: SignalPersistentStorage
  processSignal?: string
}

/**
 * Global settings for the application
 * In the future this pattern may allows us to add settings which can be dynamically set by the user.
 * Currently, this is just a way to pass settings to the different parts of the application.
 */
export class SignalGlobalSettings {
  sandbox: SandboxSettingsConfig
  signalBuffer: SignalBufferSettingsConfig
  ingestClient: SignalsIngestSettingsConfig
  network: NetworkSettingsConfig

  private sampleSuccess = false
  private signalsDebug = new SignalsDebugSettings()

  constructor(settings: SignalsSettingsConfig) {
    if (settings.maxBufferSize && settings.signalStorage) {
      throw new Error(
        'maxBufferSize and signalStorage cannot be defined at the same time'
      )
    }

    this.signalsDebug = new SignalsDebugSettings(settings.enableSignalsDebug)

    this.signalBuffer = {
      signalStorage: settings.signalStorage,
      maxBufferSize: settings.maxBufferSize,
    }
    this.ingestClient = {
      apiHost: settings.apiHost,
      flushAt: settings.flushAt,
      flushInterval: settings.flushInterval,
      shouldDisableSignalRedaction: this.signalsDebug.getSignalsDebug,
      shouldIngestSignals: () => {
        if (this.signalsDebug.getSignalsDebug()) {
          return true
        }
        if (!this.sampleSuccess) {
          return false
        }
        return false
      },
    }
    this.sandbox = {
      functionHost: settings.functionHost,
      processSignal: settings.processSignal,
      edgeFnDownloadURL: undefined,
    }
    this.network = new NetworkSettingsConfig({
      networkSignalsAllowList: settings.networkSignalsAllowList,
      networkSignalsDisallowList: settings.networkSignalsDisallowList,
      networkSignalsAllowSameDomain: settings.networkSignalsAllowSameDomain,
    })
  }
  public update({
    edgeFnDownloadURL,
    disallowListURLs,
    sampleRate,
  }: {
    /**
     * The URL to download the edge function from
     */
    edgeFnDownloadURL?: string
    /**
     * Add new URLs to the disallow list
     */
    disallowListURLs: (string | undefined)[]
    /**
     * Sample rate to determine sending signals
     */
    sampleRate: number
  }): void {
    edgeFnDownloadURL && (this.sandbox.edgeFnDownloadURL = edgeFnDownloadURL)
    this.network.networkSignalsFilterList.disallowed.addURLLike(
      ...disallowListURLs.filter(<T>(val: T): val is NonNullable<T> =>
        Boolean(val)
      )
    )
    if (Math.random() <= sampleRate) {
      this.sampleSuccess = true
    }
  }
}

class SignalsDebugSettings {
  private static key = 'segment_signals_debug'
  constructor(initialValue?: boolean) {
    if (typeof initialValue === 'boolean') {
      this.setSignalsDebug(initialValue)
    }

    // setting ?segment_signals_debug=true will disable redaction, enable ingestion, and set keys in local storage
    // this setting will persist across page loads (even if there is no query string)
    // in order to clear the setting, user must set ?segment_signals_debug=false
    const debugModeInQs = parseDebugModeQueryString()
    logger.debug('debugMode is set to true via query string')
    if (typeof debugModeInQs === 'boolean') {
      this.setSignalsDebug(debugModeInQs)
    }
  }

  setSignalsDebug(shouldDisable: boolean) {
    try {
      if (shouldDisable) {
        window.sessionStorage.setItem(SignalsDebugSettings.key, 'true')
      } else {
        logger.debug('Removing debug key from storage')
        window.sessionStorage.removeItem(SignalsDebugSettings.key)
      }
    } catch (e) {
      logger.debug('Storage error', e)
    }
  }

  getSignalsDebug() {
    try {
      const isDisabled = Boolean(
        window.sessionStorage.getItem(SignalsDebugSettings.key)
      )
      if (isDisabled) {
        logger.debug(`${SignalsDebugSettings.key}=true (app. storage)`)
        return true
      }
    } catch (e) {
      logger.debug('Storage error', e)
    }
    return false
  }
}
