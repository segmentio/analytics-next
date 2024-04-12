import { CreateWrapperSettings } from '../types'
import { AnalyticsConsentError } from '../types/errors'
import { logger } from './logger'
import { ValidationError } from './validation/validation-error'

/**
 * Thrown when a load should be cancelled.
 */
export class AbortLoadError extends AnalyticsConsentError {
  constructor(public loadSegmentNormally: boolean) {
    super('AbortLoadError', '')
  }
}

export interface AbortLoadOptions {
  /**
   * Whether or not to disable the consent requirement that is normally enforced by the wrapper.
   * If true -- load segment normally.
   */
  loadSegmentNormally: boolean
}

export class LoadToken {
  constructor(public options: LoadOptions) {}
}

interface LoadOptions {
  optIn: boolean
}

export class LoadContext {
  isAbortCalled = false
  isLoadCalled = false
  abortLoadOptions: AbortLoadOptions = {
    loadSegmentNormally: true,
  }
  loadOptions: LoadOptions = {
    /**
     * Opt-in consent
     */
    optIn: true,
  }

  /**
   * Allow analytics.js to be initialized with the consent wrapper.
   * Note: load just means 'allowed to load' -- we still wait for analytics.load to be explicitly called.
   */
  load(options: LoadOptions) {
    this.isLoadCalled = true
    this.loadOptions = { ...this.loadOptions, ...options }
    logger.debug('Load segment w/ consent', this.loadOptions)
  }
  /**
   * Abort the _consent-wrapped_ analytics.js initialization
   */
  abort(options?: AbortLoadOptions): void {
    this.isAbortCalled = true
    this.abortLoadOptions = { ...this.abortLoadOptions, ...options }
    logger.debug('Abort consent wrapper', this.loadOptions)
  }

  validate() {
    if (this.isAbortCalled && this.isLoadCalled) {
      throw new ValidationError('both abort and load should not be called')
    }
  }
}

/**
 * Wrapper for shouldLoadSegment fn
 */
export const normalizeShouldLoadSegment = (
  shouldLoadSegment: CreateWrapperSettings['shouldLoadSegment']
) => {
  return async () => {
    const loadCtx = new LoadContext()
    await shouldLoadSegment?.(loadCtx)
    loadCtx.validate()
    return loadCtx
  }
}
