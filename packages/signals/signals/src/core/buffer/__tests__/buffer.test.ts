import { sleep } from '@segment/analytics-core'
import { createMockTarget } from '../../../test-helpers/mocks/factories'
import { range } from '../../../test-helpers/range'
import { createInteractionSignal } from '../../../types/factories'
import { getSignalBuffer, SignalBuffer } from '../index'

const createMockSignal = () =>
  createInteractionSignal({
    eventType: 'submit',
    target: createMockTarget({
      id: Math.random().toString(),
    }),
  })

describe(getSignalBuffer, () => {
  let buffer: SignalBuffer
  beforeEach(async () => {
    sessionStorage.clear()
    buffer = getSignalBuffer({
      maxBufferSize: 10,
    })
    await buffer.clear()
  })
  describe('indexDB', () => {
    it('should instantiate without throwing an error', () => {
      expect(buffer).toBeTruthy()
    })
    it('should add and clear', async () => {
      const mockSignal = createInteractionSignal({
        eventType: 'submit',
        target: createMockTarget({}),
      })
      await buffer.add(mockSignal)
      await expect(buffer.getAll()).resolves.toEqual([mockSignal])
      await buffer.clear()
      await expect(buffer.getAll()).resolves.toHaveLength(0)
    })

    it('should delete older signals when maxBufferSize is exceeded', async () => {
      const signals = range(15).map(() => createMockSignal())

      for (const signal of signals) {
        await buffer.add(signal)
      }

      const storedSignals = await buffer.getAll()
      expect(storedSignals).toHaveLength(10)
      expect(storedSignals).toEqual(signals.slice(-10).reverse())
    })

    it('should delete older signals on initialize if current number exceeds maxBufferSize', async () => {
      const signals = range(15).map((_) => createMockSignal())

      for (const signal of signals) {
        await buffer.add(signal)
      }

      // Re-initialize buffer
      buffer = getSignalBuffer({
        maxBufferSize: 10,
      })

      const storedSignals = await buffer.getAll()
      expect(storedSignals).toHaveLength(10)
      expect(storedSignals).toEqual(signals.slice(-10).reverse())
    })

    it('should clear signal buffer if there is a new session according to session storage', async () => {
      const mockSignal = createMockSignal()
      await buffer.add(mockSignal)
      await expect(buffer.getAll()).resolves.toEqual([mockSignal])

      // Simulate a new session by clearing session storage and re-initializing the buffer
      sessionStorage.clear()
      await sleep(100)
      buffer = getSignalBuffer({
        maxBufferSize: 10,
      })

      await expect(buffer.getAll()).resolves.toHaveLength(0)
    })
  })
  describe('sessionStorage', () => {
    it('should instantiate without throwing an error', () => {
      expect(buffer).toBeTruthy()
    })

    it('should add and clear', async () => {
      const mockSignal = createMockSignal()
      await buffer.add(mockSignal)
      await expect(buffer.getAll()).resolves.toEqual([mockSignal])
      await buffer.clear()
      await expect(buffer.getAll()).resolves.toHaveLength(0)
    })

    it('should delete older signals when maxBufferSize is exceeded', async () => {
      const signals = range(15).map(() => createMockSignal())

      for (const signal of signals) {
        await buffer.add(signal)
      }

      const storedSignals = await buffer.getAll()
      expect(storedSignals).toHaveLength(10)
      expect(storedSignals).toEqual(signals.slice(-10).reverse())
    })
  })
})
