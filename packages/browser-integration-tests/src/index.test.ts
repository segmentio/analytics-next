import { test, expect } from '@playwright/test'
import { CDNSettingsBuilder } from '@internal/test-helpers'
import { standaloneMock } from './helpers/standalone-mock'
import { extractWriteKeyFromUrl } from './helpers/extract-writekey'

test.describe('Standalone tests', () => {
  test.beforeEach(standaloneMock)

  test.describe('Actions Amplitude', () => {
    test.beforeEach(async ({ context }) => {
      await context.route(
        'https://cdn.segment.com/v1/projects/*/settings',
        (route, request) => {
          if (request.method().toLowerCase() !== 'get') {
            return route.continue()
          }

          const writeKey = extractWriteKeyFromUrl(request.url()) || 'writeKey'
          return route.fulfill({
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(
              new CDNSettingsBuilder({ writeKey })
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
            ),
          })
        }
      )
    })

    test('applies session_id to events', async ({ page }) => {
      // Load analytics.js
      await page.goto('/standalone.html')
      await page.evaluate(() => window.analytics.load('fake-key'))

      const [request] = await Promise.all([
        page.waitForRequest('https://api.segment.io/v1/t'),
        page.evaluate(() => window.analytics.track('test event')),
      ])

      const payload = request.postDataJSON()
      expect(payload.integrations['Actions Amplitude']).toEqual({
        session_id: expect.any(Number),
      })
    })
  })

  test.describe('Braze Cloud Mode (Actions)', () => {
    test.beforeEach(async ({ context }) => {
      await context.route(
        'https://cdn.segment.com/v1/projects/*/settings',
        (route, request) => {
          if (request.method().toLowerCase() !== 'get') {
            return route.continue()
          }

          const writeKey = extractWriteKeyFromUrl(request.url()) || 'writeKey'
          return route.fulfill({
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(
              new CDNSettingsBuilder({ writeKey })
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
            ),
          })
        }
      )
    })

    test('debounces events', async ({ page }) => {
      // Load analytics.js
      await page.goto('/standalone.html')
      await page.evaluate(() => window.analytics.load('fake-key'))

      // Allows Braze the first time user is identified.
      const [request1] = await Promise.all([
        page.waitForRequest('https://api.segment.io/v1/i'),
        page.evaluate(() => window.analytics.identify('testUser')),
      ])

      expect(request1.postDataJSON().integrations).toEqual({
        Appboy: true,
        'Braze Cloud Mode (Actions)': true,
        'Braze Web Mode (Actions)': true,
      })

      // Disallows Braze if the user is unchanged.
      const [request2] = await Promise.all([
        page.waitForRequest('https://api.segment.io/v1/i'),
        page.evaluate(() => window.analytics.identify('testUser')),
      ])
      expect(request2.postDataJSON().integrations).toEqual({
        Appboy: false,
        'Braze Cloud Mode (Actions)': false,
        'Braze Web Mode (Actions)': false,
      })

      // Allows Braze if the user has changed (traits).
      const [request3] = await Promise.all([
        page.waitForRequest('https://api.segment.io/v1/i'),
        page.evaluate(() =>
          window.analytics.identify('testUser', {
            email: 'foo@foo.foo',
          })
        ),
      ])
      expect(request3.postDataJSON().integrations).toEqual({
        Appboy: true,
        'Braze Cloud Mode (Actions)': true,
        'Braze Web Mode (Actions)': true,
      })
    })
  })
})
