/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { EdgeFunction } from '..'
import { Analytics } from '../../../analytics'
import { SegmentEvent } from '../../../core/events'
import * as loadScriptHelper from '../../../lib/load-script'
import { mocked } from 'ts-jest/utils'
import unfetch from 'unfetch'
import { AnalyticsBrowser } from '../../../browser'

function addFooContext(event: SegmentEvent): SegmentEvent | null {
  if (event.context) {
    event.context.foo = 'bar'
  }
  return event
}

function addGurdasContext(event: SegmentEvent): SegmentEvent | null {
  if (event.context) {
    event.context.gurdasEmoji = 'party'
  }
  return event
}

const sourceMiddlewareFunc = [addFooContext, addGurdasContext]

const cdnResponse = {
  integrations: {},
  edgeFunction: {
    downloadURL: 'edge-fn.segment.com',
  },
}

jest.mock('unfetch', () => {
  return jest.fn()
})

const fetchSettings = Promise.resolve({
  json: () => Promise.resolve(cdnResponse),
})

describe('Edge Functions', () => {
  let ajs: Analytics

  beforeEach(async () => {
    /* eslint-disable @typescript-eslint/ban-ts-ignore */
    // @ts-ignore: ignore Response required fields
    mocked(unfetch).mockImplementation((): Promise<Response> => fetchSettings)

    const spy = jest.spyOn(loadScriptHelper, 'loadScript')

    // @ts-ignore
    spy.mockImplementation(async () => {
      ;(window as { [key: string]: any })['edge_function'] = { sourceMiddleware: sourceMiddlewareFunc } as EdgeFunction
    })

    const [analytics] = await AnalyticsBrowser.load({
      writeKey: 'abc123',
    })

    ajs = analytics
  })

  afterEach(() => {
    delete (window as { [key: string]: any })['edge_function']
  })

  test('enriches page events', async () => {
    const ctx = await ajs.page('Checkout Completed', {})

    expect(ctx.event.context).toEqual(
      expect.objectContaining({
        foo: 'bar',
        gurdasEmoji: 'party',
      })
    )
  })

  test('enriches track events', async () => {
    const ctx = await ajs.track('Button Clicked', {
      banana: 'phone',
    })

    expect(ctx.event.context).toEqual(
      expect.objectContaining({
        foo: 'bar',
        gurdasEmoji: 'party',
      })
    )
  })

  test('enriches identify events', async () => {
    const ctx = await ajs.identify('Netto', {
      banana: 'phone',
    })

    expect(ctx.event.context).toEqual(
      expect.objectContaining({
        foo: 'bar',
        gurdasEmoji: 'party',
      })
    )
  })

  test('enriches group events', async () => {
    const ctx = await ajs.group('123', {
      name: 'Initech',
      plan: 'enterprise',
      employees: 329,
    })

    // @ts-ignore
    expect(ctx.event.context).toEqual(
      expect.objectContaining({
        foo: 'bar',
        gurdasEmoji: 'party',
      })
    )
  })
})
