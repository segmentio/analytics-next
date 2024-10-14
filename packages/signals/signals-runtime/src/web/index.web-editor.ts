// all import directives will be removed in the final build
import { SignalsRuntime } from '../shared/signals-runtime'
import { ISignalsRuntime } from '../shared/shared-types'
import { Signal } from './web-signals-types'

export type Signals = ISignalsRuntime<Signal>
export const signals: Signals = new SignalsRuntime<Signal>()

/**
 * Entry point for the definitions
 */
export * from './web-signals-types'
export * from '../shared/shared-types'
export * from './web-enums'
