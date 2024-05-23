import { SignalBuffer } from '../index'

describe(SignalBuffer, () => {
  let buffer: SignalBuffer

  beforeEach(() => {
    buffer = new SignalBuffer()
  })

  it('should exits', () => {
    expect(buffer).toBeTruthy()
  })
})
