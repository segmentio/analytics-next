import { Signal } from '../../types/signals'

// could be the buffered signals object?
// This can't get indexdb, it needs to have all the signals in memory.
export class SignalsRuntime {
  constructor(private signals: Signal[]) {}
  find(..._args: any[]) {
    throw new Error('nope')
  }
  getNextIndex(..._args: any[]) {
    throw new Error('nope')
  }
}
