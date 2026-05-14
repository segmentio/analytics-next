import unfetch from 'unfetch'
import Gist from 'customerio-gist-web'
import { AnalyticsBrowser } from '..'
import { createSuccess } from '../../test-helpers/factories'

jest.mock('unfetch')

const inAppPluginName = 'Customer.io In-App Plugin'

const mockCdnWithInAppPlugin = () => {
  return jest.mocked(unfetch).mockImplementation(() =>
    createSuccess({
      integrations: {
        [inAppPluginName]: { siteId: 'cdn-site-id' },
      },
    })
  )
}

beforeEach(() => {
  mockCdnWithInAppPlugin()
  Gist.setup = jest.fn()
  Gist.clearUserToken = jest.fn()
  Gist.setUserToken = jest.fn()
  Gist.setCurrentRoute = jest.fn()
  Gist.setCustomAttribute = jest.fn()
  Gist.clearCustomAttributes = jest.fn()
  Gist.events = {
    on: jest.fn(),
    off: jest.fn(),
    dispatch: jest.fn(),
  } as unknown as typeof Gist.events
})

describe('In-App Plugin integrations option', () => {
  it('registers the In-App Plugin when CDN settings include it', async () => {
    const [analytics] = await AnalyticsBrowser.load({ writeKey: 'foo' })

    const inApp = analytics.queue.plugins.find(
      (p) => p.name === inAppPluginName
    )
    expect(inApp).toBeDefined()
    expect(Gist.setup).toHaveBeenCalledWith(
      expect.objectContaining({ siteId: 'cdn-site-id' })
    )
  })

  it('does not register the In-App Plugin when integrations sets enabled: false', async () => {
    const [analytics] = await AnalyticsBrowser.load(
      { writeKey: 'foo' },
      { integrations: { [inAppPluginName]: { enabled: false } } }
    )

    const inApp = analytics.queue.plugins.find(
      (p) => p.name === inAppPluginName
    )
    expect(inApp).toBeUndefined()
    expect(Gist.setup).not.toHaveBeenCalled()
  })

  it('registers the In-App Plugin when integrations sets enabled: true', async () => {
    const [analytics] = await AnalyticsBrowser.load(
      { writeKey: 'foo' },
      { integrations: { [inAppPluginName]: { enabled: true } } }
    )

    const inApp = analytics.queue.plugins.find(
      (p) => p.name === inAppPluginName
    )
    expect(inApp).toBeDefined()
    expect(Gist.setup).toHaveBeenCalled()
  })

  it('overrides CDN settings when integrations supplies an object', async () => {
    const [analytics] = await AnalyticsBrowser.load(
      { writeKey: 'foo' },
      { integrations: { [inAppPluginName]: { siteId: 'override-site-id' } } }
    )

    const inApp = analytics.queue.plugins.find(
      (p) => p.name === inAppPluginName
    )
    expect(inApp).toBeDefined()
    expect(Gist.setup).toHaveBeenCalledWith(
      expect.objectContaining({ siteId: 'override-site-id' })
    )
  })
})
