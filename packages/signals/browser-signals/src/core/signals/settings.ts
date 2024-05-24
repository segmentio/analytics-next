import { parseDebugModeQueryString } from '../../lib/debug-mode'
import { logger } from '../../lib/logger'
import { SignalBufferSettingsConfig, SignalPersistentStorage } from '../buffer'
import { SignalsIngestSettingsConfig } from '../client'
import { SandboxSettingsConfig } from '../processor/sandbox'

export interface SignalsSettingsConfig {
  /**
   * Size of the default signal buffer.
   * If signalStorage is defined, this setting is ignored.
   */
  maxBufferSize?: number
  /**
   * Custom signal storage implementation.
   */
  signalStorage?: SignalPersistentStorage
  /**
   * Override the default signal processing function from the edge function. If this is set, the edge function will not be used.
   */
  processSignal?: string

  /**
   * Override host of the signals API, for a custom proxy
   * Should proxy to signals.segment.io/v1
   */
  apiHost?: string

  /**
   * Override host of the edge function, for a custom proxy
   * should proxy to 'cdn.edgefn.segment.com'
   */
  functionHost?: string

  /**
   * How many signals to flush at once when sending to the signals API
   * @default 3
   */
  flushAt?: number
  /**
   * Disable signal redaction
   */
  disableSignalRedaction?: boolean
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

  private redaction = new SignalRedactionSettings()

  constructor(settings: SignalsSettingsConfig) {
    if (settings.maxBufferSize && settings.signalStorage) {
      throw new Error(
        'maxBufferSize and signalStorage cannot be defined at the same time'
      )
    }

    this.redaction = new SignalRedactionSettings(
      settings.disableSignalRedaction
    )

    this.signalBuffer = {
      signalStorage: settings.signalStorage,
      maxBufferSize: settings.maxBufferSize,
    }
    this.ingestClient = {
      apiHost: settings.apiHost,
      flushAt: settings.flushAt,
      shouldDisableSignalRedaction: this.redaction.getDisableSignalRedaction,
    }
    this.sandbox = {
      functionHost: settings.functionHost,
      processSignal: settings.processSignal,
      edgeFnDownloadURL: undefined,
    }
  }
  public update({ edgeFnDownloadURL }: { edgeFnDownloadURL?: string }): void {
    edgeFnDownloadURL && (this.sandbox.edgeFnDownloadURL = edgeFnDownloadURL)
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
      logger.debug('Error reading redaction in storage', e)
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
      logger.debug('Error setting redaction', e)
    }
    return false
  }
}
