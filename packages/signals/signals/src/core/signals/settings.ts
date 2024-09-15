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
  | 'disableSignalsRedaction'
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

  private redaction = new SignalRedactionSettings()

  constructor(settings: SignalsSettingsConfig) {
    if (settings.maxBufferSize && settings.signalStorage) {
      throw new Error(
        'maxBufferSize and signalStorage cannot be defined at the same time'
      )
    }

    this.redaction = new SignalRedactionSettings(
      settings.disableSignalsRedaction
    )

    this.signalBuffer = {
      signalStorage: settings.signalStorage,
      maxBufferSize: settings.maxBufferSize,
    }
    this.ingestClient = {
      apiHost: settings.apiHost,
      flushAt: settings.flushAt,
      flushInterval: settings.flushInterval,
      shouldDisableSignalRedaction: this.redaction.getDisableSignalRedaction,
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
  }: {
    /**
     * The URL to download the edge function from
     */
    edgeFnDownloadURL?: string
    /**
     * Add new URLs to the disallow list
     */
    disallowListURLs: (string | undefined)[]
  }): void {
    edgeFnDownloadURL && (this.sandbox.edgeFnDownloadURL = edgeFnDownloadURL)
    this.network.networkSignalsFilterList.disallowed.addURLLike(
      ...disallowListURLs.filter(<T>(val: T): val is NonNullable<T> =>
        Boolean(val)
      )
    )
  }
}

class SignalRedactionSettings {
  private static redactionKey = 'segment_signals_debug_redaction_disabled'
  constructor(initialValue?: boolean) {
    if (typeof initialValue === 'boolean') {
      this.setDisableSignalRedaction(initialValue)
    }

    // setting ?segment_signals_debug=true will disable redaction, and set a key in local storage
    // this setting will persist across page loads (even if there is no query string)
    // in order to clear the setting, user must set ?segment_signals_debug=false
    const debugModeInQs = parseDebugModeQueryString()
    logger.debug('debugMode is set to true via query string')
    if (typeof debugModeInQs === 'boolean') {
      this.setDisableSignalRedaction(debugModeInQs)
    }
  }

  setDisableSignalRedaction(shouldDisable: boolean) {
    try {
      if (shouldDisable) {
        window.sessionStorage.setItem(
          SignalRedactionSettings.redactionKey,
          'true'
        )
      } else {
        logger.debug('Removing redaction key from storage')
        window.sessionStorage.removeItem(SignalRedactionSettings.redactionKey)
      }
    } catch (e) {
      logger.debug('Storage error', e)
    }
  }

  getDisableSignalRedaction() {
    try {
      const isDisabled = Boolean(
        window.sessionStorage.getItem(SignalRedactionSettings.redactionKey)
      )
      if (isDisabled) {
        logger.debug(
          `${SignalRedactionSettings.redactionKey}=true (app. storage)`
        )
        return true
      }
    } catch (e) {
      logger.debug('Storage error', e)
    }
    return false
  }
}
