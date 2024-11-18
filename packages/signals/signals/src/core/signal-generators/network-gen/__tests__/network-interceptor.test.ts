import {
  NetworkInterceptor,
  NetworkRequestHandler,
  NetworkResponseHandler,
} from '../network-interceptor'
import { Response } from 'node-fetch'
import { EventEmitter } from 'events'

describe(NetworkInterceptor, () => {
  let interceptor: NetworkInterceptor

  afterEach(() => {
    interceptor.cleanup()
  })

  const mockRequestHandler: jest.MockedFn<NetworkRequestHandler> = jest.fn()
  const mockResponseHandler: jest.MockedFn<NetworkResponseHandler> = jest.fn()

  it('should intercept fetch requests and responses', async () => {
    interceptor = new NetworkInterceptor()
    const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
      headers: { 'Content-Type': 'application/json' },
    })

    window.fetch = jest.fn().mockResolvedValue(mockResponse)

    interceptor.addInterceptors(mockRequestHandler, mockResponseHandler)

    await window.fetch('http://example.com')

    expect(mockRequestHandler).toHaveBeenCalled()
    expect(mockResponseHandler).toHaveBeenCalled()
  })

  it('should return the actual response, not a cloned response', async () => {
    // we don't want to quietly break the users fetch implementation
    interceptor = new NetworkInterceptor()
    const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
      headers: { 'Content-Type': 'application/json' },
    })

    window.fetch = jest.fn().mockResolvedValue(mockResponse)

    interceptor.addInterceptors(
      () => {},
      async (r) => {
        // in any Response object, .text() / .json() etc are single use only -- which is why we do response.clone().
        // https://developer.mozilla.org/en-US/docs/Web/API/Response/clone
        await r.body()
      }
    )

    const response = await window.fetch('http://example.com')
    return expect(() => response.json()).not.toThrow()
  })

  // Very primitive mock for XMLHttpRequest -- better tests are at the integration level
  it('should intercept XHR requests and responses', async () => {
    interface XMLHttpRequestMock {
      open: XMLHttpRequest['open']
      send: XMLHttpRequest['send']
      setRequestHeader: XMLHttpRequest['setRequestHeader']
      getAllResponseHeaders: XMLHttpRequest['getAllResponseHeaders']
      addEventListener: XMLHttpRequest['addEventListener']
      onreadystatechange: XMLHttpRequest['onreadystatechange']
    }

    class MockXMLHttpRequest implements XMLHttpRequestMock {
      UNSENT = 0
      OPENED = 1
      HEADERS_RECEIVED = 2
      LOADING = 3
      DONE = 4

      private _emitter: EventEmitter
      public readyState = 0
      public status = 0
      public responseText = ''
      public responseURL = ''
      private _responseHeaders = ''
      public onreadystatechange: () => void = () => undefined
      constructor() {
        this._emitter = new EventEmitter().on('readystatechange', () => {
          this.onreadystatechange()
        })
      }

      open(_method: string, url: string) {
        this.responseURL = url
      }

      send() {
        setTimeout(() => {
          this.readyState = this.HEADERS_RECEIVED
          this._emitter.emit('readystatechange')
        }, 20)

        setTimeout(() => {
          this.readyState = this.LOADING
          this._emitter.emit('readystatechange')
        }, 30)

        setTimeout(() => {
          this.readyState = this.DONE
          this.status = 200
          this.responseText = JSON.stringify({ data: 'test' })
          this.responseURL = 'http://example.com'
          this._responseHeaders =
            [
              'content-type: application/json; charset=utf-8',
              'cache-control: max-age=3600',
              'x-content-type-options: nosniff',
              'date: Mon, 18 Nov 2000 12:00:00 GMT',
            ].join('\r\n') + '\r\n' // trailing CRLF to be realistic

          this._emitter.emit('readystatechange')
        }, 40)
      }

      setRequestHeader() {
        // no-op
      }

      addEventListener(event: string, listener: (ev: any) => void) {
        this._emitter.on(event, listener)
      }

      getAllResponseHeaders() {
        if (!this._responseHeaders)
          throw new Error(
            'Headers not set yet, please run this after the response is received'
          )
        return this._responseHeaders
      }
    }

    ;(globalThis as any).XMLHttpRequest = MockXMLHttpRequest
    interceptor = new NetworkInterceptor()

    interceptor.addInterceptors(mockRequestHandler, mockResponseHandler)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', 'http://example.com')
    xhr.setRequestHeader('accept', 'application/json')
    xhr.setRequestHeader('x-something-else', 'foo')
    xhr.send()

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(mockRequestHandler).toHaveBeenCalled()
    const request = mockRequestHandler.mock.calls[0][0]
    expect(request.headers).toBeInstanceOf(Headers)
    expect(request.headers!.get('accept')).toBe('application/json')
    expect(request.headers!.get('x-something-else')).toBe('foo')
    expect(mockResponseHandler).toHaveBeenCalled()
    const response = mockResponseHandler.mock.calls[0][0]
    expect(response.headers).toBeInstanceOf(Headers)
    expect(response.headers.get('content-type')).toBe(
      'application/json; charset=utf-8'
    )
    expect(response.headers.get('date')).toBe('Mon, 18 Nov 2000 12:00:00 GMT')
    expect(response.url).toBe('http://example.com')
    expect(response.status).toBe(200)
  })
})
