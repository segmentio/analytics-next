// could be the buffered signals object?

import { Signal, SignalType } from '../../types'

// This can't get indexdb, it needs to have all the signals in memory.
export class SignalsRuntime {
  buffer: Signal[]
  // @ts-ignore
  constructor(currentSignal: Signal, prevSignals: Signal[]) {
    this.buffer = prevSignals
  }

  filter = (
    predicate: (signal: Signal, index: number, arr: Signal[]) => boolean
  ): Signal[] => {
    return this.buffer.filter(predicate)
  }

  find = (
    /**
     * Signal to start searching from
     * Does this include the current signal, or not?
     */
    fromSignal: Signal,
    signalType: SignalType,
    predicate: (signal: Signal) => boolean
  ): Signal | undefined => {
    return this.buffer
      .slice(this.buffer.indexOf(fromSignal) + 1)
      .filter((el) => el.type === signalType)
      .find((signal) => predicate(signal))
  }
}

// const signal = {
//   type: 'instrumentation',
//   data: { eventName: 'click', target: {} as any },
// } as any

// const signal2 = { ...signal, data: { eventName: 'submit' } }
// const signal3 = { ...signal, data: { eventName: 'click' } }

// const f = new SignalsRuntime(signal, [signal, signal2, signal3])

// console.log(
//   f.find(signal, 'instrumentation', (signal, idx) => {
//     return signal.data.eventName === 'click'
//   })
// )
// // // Raw Signal Definitions ---------------------------------
// class Signals {
//         constructor() {
//             this.signalBuffer = []
//             this.signalCounter = 0
//             this.maxBufferSize = 1000
//         }

//         add(signal) {
//             if (this.signalCounter < 0) {
//                 // we've rolled over?  start back at zero.
//                 this.signalCounter = 0
//             }
//             if (signal.index == -1) {
//                 signal.index = getNextIndex()
//             }
//             this.signalBuffer.unshift(signal)
//             // R-E-S-P-E-C-T that's what this maxBufferSize means to me
//             if (this.signalBuffer.length > this.maxBufferSize) {
//                 this.signalBuffer.pop()
//             }
//         }

//         getNextIndex() {
//             let index = this.signalCounter
//             this.signalCounter += 1
//             return index
//         }

//         find(fromSignal, signalType, predicate) {
//             var fromIndex = 0
//             if (fromSignal != null) {
//                 this.signalBuffer.find((signal, index) => {
//                     if (fromSignal === signal) {
//                         fromIndex = index
//                     }
//                 })
//             }

//             for (let i = fromIndex; i < this.signalBuffer.length; i++) {
//                 let s = this.signalBuffer[i]
//                 if ((s.type === signalType) || (signalType == undefined)) {
//                     if (predicate != null) {
//                         try {
//                             if (predicate(s)) {
//                                 return s
//                             }
//                         } catch (e) {
//                         }
//                     } else {
//                         return s
//                     }
//                 }
//             }

//             return null
//         }

//         findAndApply(fromSignal, signalType, searchPredicate, applyPredicate) {
//             let result = this.find(fromSignal, signalType, searchPredicate)
//             if (result) {
//                 applyPredicate(result)
//             }
//             return result
//         }
//     }

//     let signals = new Signals();

//     """
//     }
