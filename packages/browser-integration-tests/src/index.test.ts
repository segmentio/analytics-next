import { readFileSync } from 'fs'
import { join as joinPath } from 'path'
import { Analytics, LegacySettings } from '@segment/analytics-next'
import { JSDOM, VirtualConsole } from 'jsdom'
import nock from 'nock'
import { snippet } from './fixtures/snippet'

const settings: LegacySettings = {
  integrations: {
    'Actions Amplitude': { versionSettings: { componentTypes: [] } },
    'Braze Cloud Mode (Actions)': {
      versionSettings: { componentTypes: ['server'] },
      type: 'server',
    },
    'Segment.io': {
      apiKey: 'writeKey',
      unbundledIntegrations: [],
      addBundledMetadata: true,
      maybeBundledConfigIds: {},
      versionSettings: { version: '4.4.7', componentTypes: ['browser'] },
      apiHost: 'api.segment.io/v1',
    },
  },
  plan: {
    track: { __default: { enabled: true, integrations: {} } },
    identify: { __default: { enabled: true } },
    group: { __default: { enabled: true } },
  },
  edgeFunction: {},
  analyticsNextEnabled: true,
  middlewareSettings: {} as any,
  enabledMiddleware: {},
  metrics: { sampleRate: 0.1, host: 'api.segment.io/v1' },
  legacyVideoPluginsEnabled: false,
  remotePlugins: [
    {
      name: 'Amplitude (Actions)',
      creationName: 'Actions Amplitude',
      libraryName: 'amplitude-pluginsDestination',
      url: 'https://cdn.segment.com/next-integrations/actions/amplitude-plugins/6765cb3cf169443c119b.js',
      settings: {
        versionSettings: { componentTypes: [] },
        subscriptions: [
          {
            id: 'nEx215jtwHt4kJmFXSmHMd',
            name: 'Browser Session Tracking',
            enabled: true,
            partnerAction: 'sessionId',
            subscribe:
              'type = "track" or type = "identify" or type = "group" or type = "page" or type = "alias"',
            mapping: {},
          },
        ],
      },
    },
    {
      name: 'Braze Cloud Mode (Actions)',
      creationName: 'Braze Cloud Mode (Actions)',
      libraryName: 'braze-cloud-pluginsDestination',
      url: 'https://cdn.segment.com/next-integrations/actions/braze-cloud-plugins/2d52367988cd53a99b14.js',
      settings: {
        versionSettings: { componentTypes: ['server'] },
        type: 'server',
        subscriptions: [
          {
            id: 'czT77wm3rgLijkwstNxLYz',
            name: 'Debounce Middleware',
            enabled: true,
            partnerAction: 'debouncePlugin',
            subscribe: 'type = "identify" or type = "group"',
            mapping: {},
          },
        ],
      },
    },
  ],
}

describe('Standalone', () => {
  let dom: JSDOM
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()

    const html = `
<!DOCTYPE html>
<html>
  <head>
    <script>
    ${snippet({})}
    </script>
  </head>
  <body>
  </body>
</html>
    `.trim()

    const virtualConsole = new VirtualConsole()
    dom = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'https://cdn.segment.com',
      virtualConsole,
    })
  })

  beforeAll(() => {
    nock('https://cdn.segment.com', { allowUnmocked: true })
      .persist()
      .get((uri) => {
        return uri.endsWith('/settings')
      })
      .reply(200, settings)
      .get((uri) => {
        return uri === '/analytics.js/v1/writeKey/analytics.min.js'
      })
      .replyWithFile(
        200,
        joinPath(
          __dirname,
          '..',
          'node_modules',
          '@segment',
          'analytics-next',
          'dist',
          'umd',
          'standalone.js'
        ),
        {
          'Content-Type': 'text/javascript',
          'access-control-allow-methods': 'GET, HEAD',
          'access-control-allow-origin': '*',
        }
      )
      .get((uri) => {
        return uri.startsWith('/analytics-next/bundles/')
      })
      .reply(function (uri, _, callback) {
        const basePath = joinPath(
          __dirname,
          '..',
          'node_modules',
          '@segment',
          'analytics-next',
          'dist',
          'umd'
        )
        const fileName = uri.split('/').pop()!
        const file = readFileSync(joinPath(basePath, fileName))
        callback(null, [
          200,
          file,
          {
            'Content-Type': 'text/javascript',
            'access-control-allow-methods': 'GET, HEAD',
            'access-control-allow-origin': '*',
          },
        ])
      })
  })

  afterAll(() => {
    nock.cleanAll()
  })

  describe('Actions Amplitude', () => {
    it('applies session_id to events', async () => {
      const analyticsSnippet = dom.window.analytics
      const analyticsPromise = new Promise<Analytics>((resolve) =>
        analyticsSnippet.on('initialize', function (this: Analytics) {
          resolve(this)
        })
      )
      analyticsSnippet.load('writeKey')
      const analytics = await analyticsPromise

      const ctx = await analytics.track('test')
      expect(ctx.event.integrations!['Actions Amplitude']).toEqual({
        session_id: expect.any(Number),
      })
    })
  })
})
