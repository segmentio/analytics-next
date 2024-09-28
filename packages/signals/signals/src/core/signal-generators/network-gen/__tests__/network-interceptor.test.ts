import { NetworkInterceptor } from '../network-interceptor'
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

      open = jest.fn().mockImplementation(() => {
        setTimeout(() => {
          this.readyState = this.OPENED
          this._emitter.emit('readystatechange')
        }, 10)

        setTimeout(() => {
          this.readyState = this.HEADERS_RECEIVED
          this._emitter.emit('readystatechange')
        }, 20)

        setTimeout(() => {
          this.readyState = this.LOADING
          this._emitter.emit('readystatechange')
        }, 30)
      })

      send = jest.fn().mockImplementation(() => {
        setTimeout(() => {
          this.readyState = 4
          this.status = 200
          this.responseText = JSON.stringify({ data: 'test' })
          this._emitter.emit('readystatechange')
          if (this.onreadystatechange) {
            this.onreadystatechange()
          }
        }, 0)
      })

      setRequestHeader = jest.fn()

      addEventListener(event: string, listener: () => void) {
        this._emitter.on(event, listener)
      }

      getAllResponseHeaders() {
        return 'Content-Type: application/json'
      }
    }

    ;(globalThis as any).XMLHttpRequest = MockXMLHttpRequest
    interceptor = new NetworkInterceptor()

    interceptor.addXhrInterceptor(mockRequestHandler, mockResponseHandler)

    const xhr = new XMLHttpRequest()
    xhr.open('GET', 'http://example.com')
    xhr.send()

    // Simulate the readyState change
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(mockRequestHandler).toHaveBeenCalled()
    expect(mockResponseHandler).toHaveBeenCalled()
  })
})
