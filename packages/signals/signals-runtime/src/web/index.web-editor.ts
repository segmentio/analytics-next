import { WebSignalsRuntime } from './web-signals-runtime'
export { WebSignalsRuntime }

export const signals = new WebSignalsRuntime()

/**
 * Entry point for the editor definitions
 */
export * from './web-signals-types'
export * from '../shared/shared-types'
export * from './web-constants'
