import { NetworkInterceptor } from '../network-interceptor'
import { Response } from 'node-fetch'

describe(NetworkInterceptor, () => {
  let interceptor: NetworkInterceptor

  beforeEach(() => {
    interceptor = new NetworkInterceptor()
  })

  afterEach(() => {
    interceptor.cleanup()
  })

  it('should intercept fetch requests and responses', async () => {
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

  it('should intercept XHR requests and responses', async () => {
    const mockRequestHandler = jest.fn()
    const mockResponseHandler = jest.fn()
    const xhr = new XMLHttpRequest()

    interceptor.addXhrInterceptor(mockRequestHandler, mockResponseHandler)

    xhr.open('GET', 'http://example.com')
    xhr.send()

    xhr.onreadystatechange = () => {
      if (xhr.readyState === xhr.DONE) {
        expect(mockRequestHandler).toHaveBeenCalled()
        expect(mockResponseHandler).toHaveBeenCalled()
      }
    }
  })
})
