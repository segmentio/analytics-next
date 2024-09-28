import { NetworkInterceptor, onXHRResponse } from '../network-interceptor'
import { Response } from 'node-fetch'
import { EventEmitter } from 'events'

describe(NetworkInterceptor, () => {
  let interceptor: NetworkInterceptor

  afterEach(() => {
    interceptor.cleanup()
  })

  it('should intercept fetch requests and responses', async () => {
    interceptor = new NetworkInterceptor()
    const mockRequestHandler = jest.fn()
    const mockResponseHandler = jest.fn()
    const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
      headers: { 'Content-Type': 'application/json' },
    })

    window.fetch = jest.fn().mockResolvedValue(mockResponse)

    interceptor.addFetchInterceptor(mockRequestHandler, mockResponseHandler)

    await window.fetch('http://example.com')

    expect(mockRequestHandler).toHaveBeenCalled()
    expect(mockResponseHandler).toHaveBeenCalled()
  })

  // Very primitive mock for XMLHttpRequest -- better tests are at the integration level
  it('should intercept XHR requests and responses', async () => {
    const mockRequestHandler = jest.fn()
    const mockResponseHandler = jest.fn()

    class MockXMLHttpRequest {
      UNSENT = 0
      OPENED = 1
      HEADERS_RECEIVED = 2
      LOADING = 3
      DONE = 4

      private _emitter = new EventEmitter()
      public readyState = 0
      public status = 0
      public responseText = ''
      public onreadystatechange: (() => void) | null = null
      public responseURL = ''
      public _responseMethod = ''
      public _responseHeaders = ''

      open(method: string, url: string) {
        this._responseMethod = method
        this.responseURL = url
      }

      async send() {
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
          this._responseHeaders = 'Content-Type: application/json'
          this._emitter.emit('readystatechange')
          if (this.onreadystatechange) {
            this.onreadystatechange()
          }
        }, 40)
      }

      setRequestHeader = jest.fn()

      addEventListener(event: string, listener: () => void) {
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

    interceptor.addXhrInterceptor(mockRequestHandler, mockResponseHandler)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', 'http://example.com')
    xhr.send()

    await new Promise((resolve) => setTimeout(resolve, 200))

    expect(mockRequestHandler).toHaveBeenCalled()
    expect(mockResponseHandler).toHaveBeenCalled()
    const response = mockResponseHandler.mock
      .calls[0][0] as Parameters<onXHRResponse>[0]
    expect(response.headers).toBeInstanceOf(Headers)
    expect(response.headers.get('content-type')).toBe('application/json')
    expect(response.url).toBe('http://example.com')
    expect(response.status).toBe(200)
  })
})
