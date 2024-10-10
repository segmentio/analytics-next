// could be the buffered signals object?

import { SignalsRuntime, Signal } from '@segment/analytics-signals-runtime'

// This needs to use the function keyword so that it can be stringified and run in a sandbox
/**
 * @param signals - List of signals, with the most recent signals first (LIFO).
 */
export function createSignalsRuntime(
  signals: Signal[]
): SignalsRuntime<Signal> {
  return new SignalsRuntime(signals)
}
