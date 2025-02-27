import { createUserDefinedSignal } from '../../types/factories'
import { SignalsPlugin } from '../signals-plugin'

// this specific test was throwing a bunch of warnings:
// 'Cannot read properties of null (reading '_origin') at Window.get sessionStorage [as sessionStorage]'
// no idea why, as sessionStorage works as usual in other tests.
const sessionStorageMock = (() => {
  let store: Record<string, any> = {}
  return {
    // @ts-ignore
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: unknown) => {
      // @ts-ignore
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      // @ts-ignore
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})
/**
 * This should be tested at the integration level
 * A few tests, just for example purposes.
 */
describe(SignalsPlugin, () => {
  test('onSignal method registers callback', () => {
    const plugin = new SignalsPlugin()
    const callback = jest.fn()
    const emitterSpy = jest.spyOn(plugin.signals.signalEmitter, 'subscribe')
    plugin.onSignal(callback)
    expect(emitterSpy).toHaveBeenCalledTimes(1)
    expect(emitterSpy.mock.calls[0][0]).toEqual(callback)
  })

  test('addSignal method emits signal', async () => {
    const plugin = new SignalsPlugin()
    const signal = createUserDefinedSignal({ foo: 'bar' })
    const emitterSpy = jest.spyOn(plugin.signals.signalEmitter, 'emit')
    plugin.addSignal(signal)
    expect(emitterSpy).toHaveBeenCalledTimes(1)
    expect(emitterSpy.mock.calls[0][0]).toEqual(signal)
  })
})
