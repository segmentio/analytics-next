import { SignalsRuntime } from '../shared/signals-runtime'
import { Signal } from './mobile-signals-types'

export class MobileSignalsRuntime extends SignalsRuntime<Signal> {
  private signalCounter: number
  private maxBufferSize: number
  constructor(signals: Signal[] = []) {
    super(signals)
    this.signalCounter = 0
    this.maxBufferSize = 1000
  }
  add = (signal: Signal) => {
    if (this.signalCounter < 0) {
      this.signalCounter = 0
    }

    if ('index' in signal && signal.index == -1) {
      // this was previously broken for ages, not sure when this code path would ever be used.
      // My understanding is that currently, getNextIndex() is called _outside_ of this function and used to construct the added signal. - seth
      signal.index = this.getNextIndex()
    }
    this.signalBuffer.unshift(signal)
    if (this.signalBuffer.length > this.maxBufferSize) {
      this.signalBuffer.pop()
    }
  }

  getNextIndex = () => {
    const index = this.signalCounter
    this.signalCounter += 1
    return index
  }
}
