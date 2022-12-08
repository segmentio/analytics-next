import { createSuccess } from '../../test-helpers/factories'
import { AnalyticsBrowser } from '../..'

import unfetch from 'unfetch'
jest.mock('unfetch')
jest
  .mocked(unfetch)
  .mockImplementation(() => createSuccess({ integrations: {} }))

const writeKey = 'foo'

describe('Inspector', () => {
  const triggeredSpy = jest.fn()
  const attachedSpy = jest.fn()
  const deliveredSpy = jest.fn()
  beforeEach(() => {
    Object.assign((window.__SEGMENT_INSPECTOR__ ??= {}), {
      triggered: triggeredSpy,
      attach: attachedSpy,
      delivered: deliveredSpy,
    })
  })
  it('attaches to inspector', async () => {
    await AnalyticsBrowser.load({
      writeKey,
    })
    expect(attachedSpy).toBeCalledTimes(1)
  })

  it('calls triggered and delivered when an event is sent', async () => {
    const [analytics] = await AnalyticsBrowser.load({
      writeKey,
    })
    expect(attachedSpy).toBeCalledTimes(1)
    expect(triggeredSpy).toBeCalledTimes(0)
    expect(deliveredSpy).toBeCalledTimes(0)

    await analytics.track('foo', {})

    expect(triggeredSpy.mock.lastCall[0].event.type).toBe('track')
    expect(triggeredSpy).toBeCalledTimes(1)
    expect(deliveredSpy).toBeCalledTimes(1)
  })
})
