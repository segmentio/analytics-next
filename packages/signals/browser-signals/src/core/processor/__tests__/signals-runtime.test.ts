import {
  InstrumentationSignal,
  InteractionSignal,
  createInstrumentationSignal,
  createInteractionSignal,
} from '../../../types'
import { SignalsRuntime } from '../signals-runtime'

describe('SignalsRuntime', () => {
  let signalsRuntime: SignalsRuntime
  let signal1: InstrumentationSignal
  let signal2: InteractionSignal
  let signal3: InteractionSignal

  beforeEach(() => {
    signal1 = createInstrumentationSignal({ type: 'track' })
    signal2 = createInteractionSignal({ eventType: 'submit', submitter: {} })
    signal3 = createInteractionSignal({ eventType: 'change' })
    signalsRuntime = new SignalsRuntime(signal1, [signal1, signal2, signal3])
  })

  describe('find', () => {
    it('should find following signal based on the provided function', () => {
      const result = signalsRuntime.find(signal2, 'interaction', () => true)
      expect(result).toEqual(signal3)
    })

    it('should return undefined if there are no following signals that match the query', () => {
      const result = signalsRuntime.find(signal1, 'instrumentation', () => true)
      expect(result).toEqual(undefined)
    })

    it('should filter based on predicate', () => {
      const result = signalsRuntime.find(
        signal1,
        'interaction',
        (signal) => signal.data.eventType === 'change'
      )
      expect(result).toEqual(signal3)
    })
  })

  describe('filter', () => {
    it('should filter signals based on the provided function', () => {
      const result = signalsRuntime.filter(
        (signal) => signal.type === 'interaction'
      )
      expect(result).toEqual([signal2, signal3])
    })
  })
})
