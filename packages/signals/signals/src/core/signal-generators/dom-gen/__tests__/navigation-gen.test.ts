import { jest } from '@jest/globals'
import { URLChangeNavigationData } from '@segment/analytics-signals-runtime'
import { setLocation } from '../../../../test-helpers/set-location'
import { SignalEmitter } from '../../../emitter'
import { OnNavigationEventGenerator } from '../navigation-gen'

const originalLocation = window.location

describe(OnNavigationEventGenerator, () => {
  let emitter: SignalEmitter
  let emitSpy: jest.SpiedFunction<SignalEmitter['emit']>

  beforeEach(() => {
    setLocation(originalLocation)
    jest.useFakeTimers()
    emitter = new SignalEmitter()
    emitSpy = jest.spyOn(emitter, 'emit')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should emit an event with action "pageLoad" on initialization', () => {
    const generator = new OnNavigationEventGenerator()
    generator.register(emitter)
    expect(emitSpy).toHaveBeenCalledTimes(1)
    expect(emitSpy.mock.lastCall).toMatchInlineSnapshot(`
      [
        {
          "anonymousId": "",
          "context": {
            "library": {
              "name": "@segment/analytics-next",
              "version": "0.0.0",
            },
            "signalsRuntime": "",
          },
          "data": {
            "currentUrl": "http://localhost/",
            "hash": "",
            "page": {
              "hash": "",
              "hostname": "localhost",
              "path": "/",
              "referrer": "",
              "search": "",
              "title": "",
              "url": "http://localhost/",
            },
            "path": "/",
            "search": "",
            "title": "",
          },
          "index": undefined,
          "timestamp": <ISO Timestamp>,
          "type": "navigation",
        },
      ]
    `)
  })

  it('should emit an event with "action: urlChange" when the URL changes', () => {
    const generator = new OnNavigationEventGenerator()

    generator.register(emitter)

    // Simulate a URL change
    const newUrl = new URL(location.href)
    newUrl.pathname = '/new-path'
    newUrl.search = '?query=123'
    newUrl.hash = '#hello'
    setLocation({
      href: newUrl.href,
      pathname: newUrl.pathname,
      search: newUrl.search,
      hash: newUrl.hash,
    })

    // Advance the timers to trigger the polling
    jest.advanceTimersByTime(1000)

    expect(emitSpy).toHaveBeenCalledTimes(2)

    expect(emitSpy.mock.lastCall).toMatchInlineSnapshot(`
      [
        {
          "anonymousId": "",
          "context": {
            "library": {
              "name": "@segment/analytics-next",
              "version": "0.0.0",
            },
            "signalsRuntime": "",
          },
          "data": {
            "changedProperties": [
              "path",
              "search",
              "hash",
            ],
            "currentUrl": "http://localhost/new-path?query=123#hello",
            "hash": "#hello",
            "page": {
              "hash": "#hello",
              "hostname": "localhost",
              "path": "/new-path",
              "referrer": "",
              "search": "?query=123",
              "title": "",
              "url": "http://localhost/new-path?query=123#hello",
            },
            "path": "/new-path",
            "previousUrl": "http://localhost/",
            "search": "?query=123",
            "title": "",
          },
          "index": undefined,
          "timestamp": <ISO Timestamp>,
          "type": "navigation",
        },
      ]
    `)
  })

  it('should only list the property that actually changed in changedProperties, and no more/less', () => {
    const generator = new OnNavigationEventGenerator()

    generator.register(emitter)

    const newUrl = new URL(location.href)
    newUrl.hash = '#hello'
    setLocation({
      href: newUrl.href,
      hash: newUrl.hash,
    })

    jest.advanceTimersByTime(1000)
    const lastCall = emitSpy.mock.lastCall![0].data as URLChangeNavigationData
    expect(lastCall.changedProperties).toEqual(['hash'])
  })

  it('should stop emitting events after unsubscribe is called', () => {
    const generator = new OnNavigationEventGenerator()

    const unsubscribe = generator.register(emitter)

    // Simulate a URL change
    const newUrl = new URL(location.href)
    newUrl.pathname = '/new-path'
    setLocation({
      href: newUrl.href,
      pathname: newUrl.pathname,
    })

    // Advance the timers to trigger the polling
    jest.advanceTimersByTime(1000)

    // Ensure the event is emitted before unsubscribe
    expect(emitSpy).toHaveBeenCalledTimes(2)

    // Unsubscribe the generator
    unsubscribe()

    // Simulate another URL change
    newUrl.pathname = '/another-path'
    setLocation({
      href: newUrl.href,
      pathname: newUrl.pathname,
    })

    // Advance the timers again
    jest.advanceTimersByTime(1000)

    // Ensure no additional events are emitted after unsubscribe
    expect(emitSpy).toHaveBeenCalledTimes(2)
  })
})
