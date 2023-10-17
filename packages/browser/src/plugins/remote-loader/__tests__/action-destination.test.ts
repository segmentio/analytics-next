import unfetch from 'unfetch'
import braze from '@segment/analytics-browser-actions-braze'
import { CDNSettingsBuilder } from '@internal/test-helpers'

import { AnalyticsBrowser } from '../../../browser'
import { createSuccess } from '../../../test-helpers/factories'
import { JSDOM } from 'jsdom'

const writeKey = 'abc'

jest.mock('unfetch')
jest.mocked(unfetch).mockImplementation(() =>
  createSuccess(
    new CDNSettingsBuilder({ writeKey })
      .addActionDestinationSettings({
        name: 'Braze Web Mode (Actions)',
        creationName: 'Braze Web Mode (Actions)',
        libraryName: 'brazeDestination',
        url: 'https://cdn.segment.com/next-integrations/actions/braze/a6f95f5869852b848386.js',
        settings: {
          api_key: 'test-api-key',
          versionSettings: {
            componentTypes: [],
          },
          subscriptions: [
            {
              id: '3thVuvYKBcEGKEZA185Tbs',
              name: 'Track Calls',
              enabled: true,
              partnerAction: 'trackEvent',
              subscribe: 'type = "track" and event != "Order Completed"',
              mapping: {
                eventName: {
                  '@path': '$.event',
                },
                eventProperties: {
                  '@path': '$.properties',
                },
              },
            },
          ],
        },
      })
      .build()
  )
)

beforeEach(async () => {
  const html = `
  <!DOCTYPE html>
    <head>
      <script>'hi'</script>
    </head>
    <body>
    </body>
  </html>
  `.trim()

  const jsd = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'https://localhost',
  })

  const windowSpy = jest.spyOn(global, 'window', 'get')
  windowSpy.mockImplementation(
    () => jsd.window as unknown as Window & typeof globalThis
  )

  const documentSpy = jest.spyOn(global, 'document', 'get')
  documentSpy.mockImplementation(
    () => jsd.window.document as unknown as Document
  )
})

describe('ActionDestination', () => {
  it('captures essential metrics when invoking methods on an action plugin', async () => {
    const ajs = AnalyticsBrowser.load({
      writeKey: 'abc',
      plugins: [braze as any],
    })

    await ajs.ready()

    expect(ajs.ctx?.stats.metrics).toHaveLength(1)

    expect(ajs.ctx?.stats.metrics[0]).toMatchObject(
      expect.objectContaining({
        metric: 'analytics_js.action_plugin.invoke',
        tags: [
          'method:load',
          'action_plugin_name:Braze Web Mode (Actions) trackEvent',
        ],
      })
    )

    const trackCtx = await ajs.track('test')

    const actionInvokeMetric = trackCtx.stats.metrics.find(
      (m) => m.metric === 'analytics_js.action_plugin.invoke'
    )

    expect(actionInvokeMetric).toMatchObject(
      expect.objectContaining({
        metric: 'analytics_js.action_plugin.invoke',
        tags: [
          'method:track',
          'action_plugin_name:Braze Web Mode (Actions) trackEvent',
        ],
      })
    )
  })
})
