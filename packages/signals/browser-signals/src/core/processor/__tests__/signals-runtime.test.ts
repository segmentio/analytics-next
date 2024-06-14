import { InstrumentationSignal, InteractionSignal } from '../../../types'
import { SignalsRuntime } from '../signals-runtime'

const createInstrumentationSignal = (rawEvent: any): InstrumentationSignal => {
  return {
    type: 'instrumentation',
    data: {
      rawEvent,
    },
  }
}

const createInteractionSignal = (data: any): InteractionSignal => {
  return {
    type: 'interaction',
    data,
  }
}

describe('SignalsRuntime', () => {
  let signalsRuntime: SignalsRuntime
  let signal1: InstrumentationSignal
  let signal2: InteractionSignal
  let signal3: InteractionSignal

  beforeEach(() => {
    signal1 = createInstrumentationSignal({ eventName: 'click' })
    signal2 = createInteractionSignal({ eventType: 'submit' })
    signal3 = createInteractionSignal({ eventType: 'change' })
    signalsRuntime = new SignalsRuntime(signal1, [signal1, signal2, signal3])
  })

  describe('find', () => {
    it('should find a signal based on the provided function', () => {
      const result = signalsRuntime.find(
        signal1,
        'instrumentation',
        (signal) => signal.type === 'instrumentation'
      )
      expect(result).toEqual(signal1)
    })

    it('should return undefined if no signal matches the provided function', () => {
      const result = signalsRuntime.find(
        signal1,
        'instrumentation',
        (signal) => signal.type === ('nonexistent' as any)
      )
      expect(result).toBeUndefined()
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
