import { MobileSignalsRuntime } from './mobile-signals-runtime'
export { MobileSignalsRuntime }

export const signals = new MobileSignalsRuntime()

/**
 * Entry point for the editor definitions
 */
export * from './mobile-signals-types'
export * from '../shared/shared-types'
export * from './mobile-constants'
