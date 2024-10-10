import { createInteractionSignal } from '../../../types/factories'
import { getSignalBuffer, SignalBuffer } from '../index'

describe(getSignalBuffer, () => {
  let buffer: SignalBuffer
  beforeEach(async () => {
    buffer = getSignalBuffer({
      maxBufferSize: 10,
    })
    await buffer.clear()
  })

  it('should instantiate without throwing an error', () => {
    expect(buffer).toBeTruthy()
  })
  it('should add and clear', async () => {
    const mockSignal = createInteractionSignal({
      eventType: 'submit',
      submitter: {},
    })
    await buffer.add(mockSignal)
    await expect(buffer.getAll()).resolves.toEqual([mockSignal])
    await buffer.clear()
    await expect(buffer.getAll()).resolves.toHaveLength(0)
  })
})
