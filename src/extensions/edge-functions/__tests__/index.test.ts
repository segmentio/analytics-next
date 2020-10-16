/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { EdgeFunction } from '..'
import { Analytics } from '../../../index'
import { SegmentEvent } from '../../../core/events'
import * as loadScriptHelper from '../../../lib/load-script'

let ajs: Analytics

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

describe('Edge Functions', () => {
  beforeEach(async () => {
    const spy = jest.spyOn(loadScriptHelper, 'loadScript')
    spy.mockImplementation(async () => {
      ;(window as { [key: string]: any })['edge_function'] = { sourceMiddleware: sourceMiddlewareFunc } as EdgeFunction
    })
    ;[ajs] = await Analytics.load({
      writeKey: 'abc123',
    })
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
