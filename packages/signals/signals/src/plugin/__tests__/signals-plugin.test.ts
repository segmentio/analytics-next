import { SignalsPlugin } from '../signals-plugin'

/**
 * This should be tested at the integration level
 * A few tests, just for example purposes.
 */
describe(SignalsPlugin, () => {
  let plugin: SignalsPlugin
  beforeEach(() => {
    plugin = new SignalsPlugin()
  })

  test('onSignal method registers callback', () => {
    const callback = jest.fn()
    const emitterSpy = jest.spyOn(plugin.signals.signalEmitter, 'subscribe')
    plugin.onSignal(callback)
    expect(emitterSpy).toHaveBeenCalledTimes(1)
    expect(emitterSpy.mock.calls[0][0]).toEqual(callback)
  })

  test('addSignal method emits signal', () => {
    const signal = { data: 'test' } as any
    const emitterSpy = jest.spyOn(plugin.signals.signalEmitter, 'emit')
    plugin.addSignal(signal)
    expect(emitterSpy).toHaveBeenCalledTimes(1)
    expect(emitterSpy.mock.calls[0][0]).toEqual({ data: 'test' })
  })
})
