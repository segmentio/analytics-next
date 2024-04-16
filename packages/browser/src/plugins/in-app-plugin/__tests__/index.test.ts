import { Analytics } from '../../../core/analytics'
import { pageEnrichment } from '../../page-enrichment'
import { CustomerioSettings } from '../../customerio'
import { InAppPlugin, InAppPluginSettings } from '../'
import Gist from 'customerio-gist-web'

describe('Customer.io In-App Plugin', () => {
  let analytics: Analytics
  let gistMessageShown: Function
  let gistMessageAction: Function
  let gistEventDispatched: Function

  beforeEach(async () => {
    if(typeof analytics !== 'undefined') {
      analytics.reset()
    }

    jest.resetAllMocks()
    jest.restoreAllMocks()

    Gist.setup = jest.fn()
    Gist.clearUserToken = jest.fn()
    Gist.setUserToken = jest.fn()
    Gist.setCurrentRoute = jest.fn()
    Gist.events = {
      on: (name: string, cb: Function) => {
        if(name === 'messageShown') {
          gistMessageShown = cb
        } else if(name === 'messageAction') {
          gistMessageAction = cb
        } else if(name === 'eventDispatched') {
          gistEventDispatched = cb
        }
      },
      off: jest.fn(),
    }

    const options: CustomerioSettings = { apiKey: 'foo' }
    analytics = new Analytics({ writeKey: options.apiKey })

    await analytics.register(InAppPlugin({ siteId: 'siteid'} as InAppPluginSettings), pageEnrichment)
  })

  it('should setup gist with defaults', async () => {
    expect(Gist.setup).toBeCalledTimes(1)
    expect(Gist.setup).toBeCalledWith({
      env: 'prod',
      logging: undefined,
      siteId: 'siteid',
    })
    // We should clear old gist tokens on setup if we're anonymous
    expect(Gist.clearUserToken).toBeCalledTimes(1)
  })

  it('should set gist route on page()', async () => {
    await analytics.page('testpage')
    expect(Gist.setCurrentRoute).toBeCalledWith('testpage')
  })

  it('should set gist userToken on identify()', async () => {
    await analytics.identify('testuser@customer.io')
    expect(Gist.setUserToken).toBeCalledTimes(1)
    expect(Gist.setUserToken).toBeCalledWith('testuser@customer.io')
  })

  it('should clear gist userToken on reset()', async () => {
    // Once during setup
    expect(Gist.clearUserToken).toBeCalledTimes(1)

    await analytics.identify('testuser@customer.io')
    expect(Gist.setUserToken).toBeCalledTimes(1)
    expect(Gist.setUserToken).toBeCalledWith('testuser@customer.io')

    await analytics.reset()

    // Once after reset()
    expect(Gist.clearUserToken).toBeCalledTimes(2)
  })

  it('should trigger journey event for open', async () => {
    const spy = jest.spyOn(analytics, 'track')
    gistMessageShown({
      properties: {
        gist: {
          campaignId: 'testcampaign',
        },
      },
    })
    expect(spy).toBeCalledWith('Report Delivery Event', {
      deliveryId: 'testcampaign',
      metric: 'opened',
    })
  })

  it('should trigger journey event for non-dismiss click', async () => {
    const spy = jest.spyOn(analytics, 'track')
    gistMessageAction({
      message: {
        properties: {
          messageId: 'a-test-in-app',
          gist: {
            campaignId: 'testcampaign',
          },
        },
      },
      action: 'action value',
      name: 'action name',
    })
    expect(spy).toBeCalledWith('Report Delivery Event', {
      deliveryId: 'testcampaign',
      metric: 'clicked',
      actionName: 'action name',
      actionValue: 'action value',
    })
  })

  it('should not trigger journey event for dismiss click', async () => {
    const spy = jest.spyOn(analytics, 'track')
    gistMessageAction({
      message: {
        properties: {
          messageId: 'a-test-in-app',
          gist: {
            campaignId: 'testcampaign',
          },
        },
      },
      action: 'gist://close',
      name: 'action name',
    })
    expect(spy).toHaveBeenCalledTimes(0)
  })

  it('should trigger journeys event for analytics:track', async () => {
    const spy = jest.spyOn(analytics, 'track')
    gistEventDispatched({
      name: 'analytics:track',
      payload: {
        event: 'test-event',
        properties: {
          attr1: 'val1',
          attr2: 'val2',
        },
      },
    })
    expect(spy).toBeCalledWith('test-event', {
      attr1: 'val1',
      attr2: 'val2',
    }, undefined)
  })
})
