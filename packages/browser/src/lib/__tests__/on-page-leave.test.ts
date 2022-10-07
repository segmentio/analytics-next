import { onPageLeave } from '../on-page-leave'

const helpers = {
  dispatchEvent(event: 'pagehide' | 'visibilitychange') {
    document.dispatchEvent(new Event(event))
  },
  setVisibilityState(state: DocumentVisibilityState) {
    Object.defineProperty(document, 'visibilityState', {
      value: state,
      writable: true,
    })
  },
  dispatchVisChangeEvent(state: DocumentVisibilityState) {
    helpers.setVisibilityState(state)
    helpers.dispatchEvent('visibilitychange')
  },
  dispatchPageHideEvent() {
    helpers.dispatchEvent('pagehide')
  },
}

beforeEach(() => {
  helpers.setVisibilityState('visible')
})

describe('onPageLeave', () => {
  test('callback should fire on pagehide', () => {
    const cb = jest.fn()
    onPageLeave(cb)
    helpers.dispatchPageHideEvent()
    expect(cb).toBeCalledTimes(1)
  })

  test('callback should fire if document becomes hidden', () => {
    const cb = jest.fn()
    onPageLeave(cb)
    helpers.dispatchVisChangeEvent('hidden')
    expect(cb).toBeCalledTimes(1)
  })

  test('callback should *not* fire if document becomes visible', () => {
    const cb = jest.fn()
    onPageLeave(cb)
    helpers.dispatchVisChangeEvent('visible')
    expect(cb).not.toBeCalled()
  })

  test('if both event handlers fire, callback should still fire only once', () => {
    const cb = jest.fn()
    onPageLeave(cb)
    helpers.dispatchVisChangeEvent('hidden')
    helpers.dispatchPageHideEvent()
    expect(cb).toBeCalledTimes(1)
  })

  test('if user leaves a tab, returns, and leaves again, callback should be called on each departure', () => {
    const cb = jest.fn()
    onPageLeave(cb)
    helpers.dispatchVisChangeEvent('hidden')
    helpers.dispatchVisChangeEvent('visible')
    helpers.dispatchVisChangeEvent('hidden')
    expect(cb).toBeCalledTimes(2)
  })
})
