import { Page, Route, Request } from '@playwright/test'
import { SegmentEvent } from '@segment/analytics-next'
import { Signal } from '@segment/analytics-signals'

type FulfillOptions = Parameters<Route['fulfill']>['0']
export interface XHRRequestOptions {
  method?: string
  body?: any
  contentType?: string
  responseType?: XMLHttpRequestResponseType
  responseLatency?: number
}
export class PageNetworkUtils {
  private defaultTestApiURL = 'http://localhost:5432/api/foo'
  private defaultResponseTimeout = 3000
  constructor(public page: Page) {}

  async makeXHRCall(
    url = this.defaultTestApiURL,
    reqOptions: XHRRequestOptions = {}
  ): Promise<any> {
    let normalizeUrl = url
    if (url.startsWith('/')) {
      normalizeUrl = new URL(url, this.page.url()).href
    }
    const req = this.page.waitForResponse(normalizeUrl ?? url, {
      timeout: this.defaultResponseTimeout,
    })
    const responseBody = this.page.evaluate(
      (args) => {
        return new Promise<any>((resolve) => {
          const xhr = new XMLHttpRequest()
          xhr.open(args.method ?? 'POST', args.url)

          const contentType = args.contentType ?? 'application/json'
          xhr.setRequestHeader('Content-Type', contentType)

          xhr.responseType = args.responseType
            ? args.responseType
            : contentType.includes('json')
            ? 'json'
            : '' // '' is the same as 'text' according to xhr spec

          if (typeof args.responseLatency === 'number') {
            xhr.setRequestHeader(
              'x-test-latency',
              args.responseLatency.toString()
            )
          }
          xhr.send(args.body ?? JSON.stringify({ foo: 'bar' }))
          xhr.onload = () => resolve(xhr.response)
        })
      },
      { url, ...reqOptions }
    )
    await req
    return responseBody
  }
  /**
   * Make a fetch call in the page context. By default it will POST a JSON object with {foo: 'bar'}
   */
  async makeFetchCall(
    url = this.defaultTestApiURL,
    request: Partial<RequestInit> & {
      contentType?: string
      unwrapResponseBody?: boolean
    } = {}
  ): Promise<any> {
    let normalizeUrl = url
    if (url.startsWith('/')) {
      normalizeUrl = new URL(url, this.page.url()).href
    }
    const req = this.page.waitForResponse(normalizeUrl ?? url, {
      timeout: this.defaultResponseTimeout,
    })
    const responseBody = await this.page.evaluate(
      async (args) => {
        const res = await fetch(args.url, {
          method: 'POST',
          headers: {
            'Content-Type': args.request.contentType ?? 'application/json',
          },
          body: JSON.stringify({ foo: 'bar' }),
          ...args.request,
        })
        const type = res.headers.get('Content-Type')
        if (type?.includes('json')) {
          return res.json()
        } else if (type?.includes('text')) {
          return res.text()
        } else {
          console.error('Unexpected response content type')
        }
      },
      { url, request }
    )
    await req
    return responseBody
  }

  async mockTestRoute(
    url = this.defaultTestApiURL,
    response?: Partial<FulfillOptions>
  ) {
    if (url.startsWith('/')) {
      url = new URL(url, this.page.url()).href
    }
    await this.page.route(url, async (route) => {
      const latency = this.extractLatency(route)

      // if a custom latency is set in the request headers, use that instead

      await new Promise((resolve) => setTimeout(resolve, latency))
      return route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({ someResponse: 'yep' }),
        ...response,
      })
    })
  }
  private extractLatency(route: Route) {
    let latency = 0
    if (route.request().headers()['x-test-latency']) {
      const customLatency = parseInt(
        route.request().headers()['x-test-latency']
      )
      if (customLatency) {
        latency = customLatency
      }
    }
    return latency
  }
}

export class TrackingAPIRequestBuffer {
  private requests: Request[] = []
  public lastEvent(): SegmentEvent {
    const allEvents = this.getEvents()
    return allEvents[allEvents.length - 1]
  }
  public getEvents(): SegmentEvent[] {
    return this.requests.flatMap((req) => {
      const body = req.postDataJSON()
      return 'batch' in body ? body.batch : [body]
    })
  }

  clear() {
    this.requests = []
  }

  addRequest(request: Request) {
    if (request.method().toLowerCase() !== 'post') {
      throw new Error(
        `Unexpected method: ${request.method()}, Tracking API only accepts POST`
      )
    }
    this.requests.push(request)
  }
}

export class SignalAPIRequestBuffer extends TrackingAPIRequestBuffer {
  override getEvents(signalType?: Signal['type']): SegmentEvent[] {
    if (signalType) {
      return this.getEvents().filter((e) => e.properties!.type === signalType)
    }
    return super.getEvents()
  }

  override lastEvent(signalType?: Signal['type']): SegmentEvent {
    if (signalType) {
      const res =
        this.getEvents(signalType)[this.getEvents(signalType).length - 1]
      if (!res) {
        throw new Error(`No signal of type ${signalType} found`)
      }
      return res
    }
    return super.lastEvent()
  }
}
