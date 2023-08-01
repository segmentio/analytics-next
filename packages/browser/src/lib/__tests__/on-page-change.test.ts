import { onPageChange } from '../on-page-change'

const helpers = {
  dispatchEvent(event: 'pagehide' | 'visibilitychange') {
    const target = event === 'pagehide' ? window : document
    target.dispatchEvent(new Event(event))
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

describe('onPageChange', () => {
  test('callback should fire on pagehide', () => {
    const cb = jest.fn()
    onPageChange(cb)
    helpers.dispatchPageHideEvent()
    expect(cb).toBeCalledTimes(1)
  })

  test('callback should fire if document becomes hidden', () => {
    const cb = jest.fn()
    onPageChange(cb)
    helpers.dispatchVisChangeEvent('hidden')
    expect(cb).toBeCalledTimes(1)
  })

  test('callback should fire if document becomes visible', () => {
    const cb = jest.fn()
    onPageChange(cb)
    helpers.dispatchVisChangeEvent('visible')
    expect(cb).toBeCalledTimes(1)
  })

  test('if both event handlers fire, callback should still fire only once', () => {
    const cb = jest.fn()
    onPageChange(cb)
    helpers.dispatchVisChangeEvent('hidden')
    helpers.dispatchPageHideEvent()
    expect(cb).toBeCalledTimes(1)
  })

  test('if user leaves a tab, returns, and leaves again, callback should be called on each navigation', () => {
    const cb = jest.fn()
    onPageChange(cb)
    helpers.dispatchVisChangeEvent('hidden')
    helpers.dispatchVisChangeEvent('visible')
    helpers.dispatchVisChangeEvent('hidden')
    expect(cb).toBeCalledTimes(3)
  })

  test('if user navigates, callback should be passed appropriate "unloaded" value', () => {
    const cb = jest.fn()
    onPageChange(cb)
    helpers.dispatchVisChangeEvent('hidden')
    expect(cb).toBeCalledWith(true)
    helpers.dispatchVisChangeEvent('visible')
    expect(cb).toBeCalledWith(false)
  })
})
