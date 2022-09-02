/**
 * @jest-environment jsdom
 */

import { isOffline, isOnline } from '..'

describe('connection', () => {
  let online = true

  beforeEach(() => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      get() {
        return online
      },
    })
  })

  test('checks that the browser is online', () => {
    online = true

    expect(isOnline()).toBe(true)
    expect(isOffline()).toBe(false)
  })

  test('checks that the browser is offline', () => {
    online = false

    expect(isOnline()).toBe(false)
    expect(isOffline()).toBe(true)
  })
})
