import { SignalsRuntime } from '../shared/signals-runtime'
import { ISignalsRuntime } from './index.mobile-editor'
import { Signal } from './mobile-signals-types'

export type Signals = ISignalsRuntime<Signal>
export const signals: Signals = new SignalsRuntime<Signal>()
/**
 * This is the public API for this package.
 * We avoid using splat (*) exports so that we can control what is exposed.
 */
export * from './mobile-signals-types'
export * from '../shared/shared-types'
export * from './mobile-enums'
