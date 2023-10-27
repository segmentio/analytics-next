import unfetch from 'unfetch'
import { PluginFactory } from '..'

import { AnalyticsBrowser } from '../../../browser'
import { createSuccess } from '../../../test-helpers/factories'

jest.mock('unfetch')
jest.mocked(unfetch).mockImplementation(() =>
  createSuccess({
    integrations: {},
    remotePlugins: [
      {
        name: 'testDestination',
        libraryName: 'testDestination',
        settings: {
          subscriptions: [
            {
              name: 'Track Calls',
              enabled: true,
              partnerAction: 'trackEvent',
              subscribe: 'type = "track"',
            },
          ],
        },
      },
    ],
  })
)

const testDestination: PluginFactory = () => {
  return {
    name: 'testDestination',
    version: '1.0.0',
    type: 'destination',
    isLoaded: () => true,
    load: () => Promise.resolve(),
    track: (ctx) => Promise.resolve(ctx),
  }
}

testDestination.pluginName = 'testDestination'

describe('ActionDestination', () => {
  it('captures essential metrics when invoking methods on an action plugin', async () => {
    const ajs = AnalyticsBrowser.load({
      writeKey: 'abc',
      plugins: [testDestination],
    })

    await ajs.ready()

    expect(ajs.ctx?.stats.metrics[0]).toMatchObject(
      expect.objectContaining({
        metric: 'analytics_js.integration.invoke',
        tags: [
          'method:load',
          'integration_name:testDestination',
          'type:destination',
        ],
      })
    )

    const trackCtx = await ajs.track('test')

    const actionInvokeMetric = trackCtx.stats.metrics.find(
      (m) => m.metric === 'analytics_js.integration.invoke'
    )

    expect(actionInvokeMetric).toMatchObject(
      expect.objectContaining({
        metric: 'analytics_js.integration.invoke',
        tags: [
          'method:track',
          'integration_name:testDestination',
          'type:destination',
        ],
      })
    )
  })
})
