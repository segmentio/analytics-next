import {
  InstrumentationSignal,
  InteractionSignal,
  SignalsRuntime,
  Signal,
} from '../index'
import {
  mockInstrumentationSignal,
  mockInteractionSignal,
} from '../test-helpers/mocks/mock-signal-types-web'

describe(SignalsRuntime, () => {
  let signalsRuntime: SignalsRuntime<Signal>
  let signal1: InstrumentationSignal
  let signal2: InteractionSignal
  let signal3: InteractionSignal

  beforeEach(() => {
    signal1 = mockInstrumentationSignal
    signal2 = mockInteractionSignal
    signal3 = {
      ...mockInteractionSignal,
      data: { eventType: 'change', target: {} },
    }
    signalsRuntime = new SignalsRuntime<Signal>([signal1, signal2, signal3])
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

    it('should return the first match if predicate is not provided', () => {
      const result = signalsRuntime.find(signal1, 'interaction')
      expect(result).toEqual(signal2)
    })
  })
})
