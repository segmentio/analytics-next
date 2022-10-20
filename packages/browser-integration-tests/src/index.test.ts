import { createReadStream } from 'fs'
import { join as joinPath } from 'path'
import { Analytics, InitOptions } from '@segment/analytics-next'
import { JSDOM, VirtualConsole } from 'jsdom'
import nock, { Scope } from 'nock'
import { snippet } from './fixtures/snippet'
import { CORS } from './fixtures/cors-headers'
import { SettingsBuilder } from './fixtures/settings'

describe('Standalone', () => {
  let dom: JSDOM
  let loadAnalytics: (options?: InitOptions) => Promise<Analytics>

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()

    const html = `
<!DOCTYPE html>
<html>
  <head>
    <script>
    ${snippet()}
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
      url: 'https://segment.com',
      virtualConsole,
    })

    loadAnalytics = async (options?: InitOptions): Promise<Analytics> => {
      const analyticsSnippet = dom.window.analytics
      const analyticsPromise = new Promise<Analytics>((resolve) =>
        analyticsSnippet.on('initialize', function (this: Analytics) {
          resolve(this)
        })
      )
      analyticsSnippet.load('writeKey', options)
      const analytics = await analyticsPromise
      return analytics
    }
  })

  let scope: Scope

  beforeEach(() => {
    const ajsBasePath = joinPath(
      __dirname,
      '..',
      'node_modules',
      '@segment',
      'analytics-next',
      'dist',
      'umd'
    )

    // Intercepts any requests for A.JS bundles and serves them from
    // the monorepo.
    scope = nock('https://cdn.segment.com', { allowUnmocked: true })
      .persist()
      .get((uri) => {
        return uri === '/analytics.js/v1/writeKey/analytics.min.js'
      })
      .replyWithFile(200, joinPath(ajsBasePath, 'standalone.js'), {
        ...CORS,
        'Content-Type': 'text/javascript',
      })
      .get((uri) => {
        return uri.startsWith('/analytics-next/bundles/')
      })
      .optionally()
      .reply(function (uri, _, callback) {
        const fileName = uri.split('/').pop()!
        const file = createReadStream(joinPath(ajsBasePath, fileName))
        callback(null, [
          200,
          file,
          {
            ...CORS,
            'Content-Type': 'text/javascript',
          },
        ])
      })
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('Actions Amplitude', () => {
    const settings = new SettingsBuilder()
      .addActionDestinationSettings({
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
      })
      .build()

    beforeEach(() => {
      // intercept `/settings`
      scope
        .get((uri) => {
          return uri.endsWith('/settings')
        })
        .reply(200, settings, {
          ...CORS,
          'Content-Type': 'application/json',
        })
    })

    it('applies session_id to events', async () => {
      const analytics = await loadAnalytics()

      const ctx = await analytics.track('test')
      expect(ctx.event.integrations!['Actions Amplitude']).toEqual({
        session_id: expect.any(Number),
      })
    })
  })

  describe('Braze Cloud Mode (Actions)', () => {
    const settings = new SettingsBuilder()
      .addActionDestinationSettings({
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
      })
      .build()

    beforeEach(() => {
      // intercept `/settings`
      scope
        .get((uri) => {
          return uri.endsWith('/settings')
        })
        .reply(200, settings, {
          ...CORS,
          'Content-Type': 'application/json',
        })
    })

    it('debounces events', async () => {
      const analytics = await loadAnalytics()

      // Allows Braze the first time user is identified.
      const ctx1 = await analytics.identify('testUser')
      expect(ctx1.event.integrations!).toEqual({
        Appboy: true,
        'Braze Cloud Mode (Actions)': true,
        'Braze Web Mode (Actions)': true,
      })

      // Disallows Braze if the user is unchanged.
      const ctx2 = await analytics.identify('testUser')
      expect(ctx2.event.integrations).toEqual({
        Appboy: false,
        'Braze Cloud Mode (Actions)': false,
        'Braze Web Mode (Actions)': false,
      })

      // Allows Braze if the user has changed (traits)
      const ctx3 = await analytics.identify('testUser', {
        email: 'foo@foo.foo',
      })
      expect(ctx3.event.integrations).toEqual({
        Appboy: true,
        'Braze Cloud Mode (Actions)': true,
        'Braze Web Mode (Actions)': true,
      })
    })
  })
})
