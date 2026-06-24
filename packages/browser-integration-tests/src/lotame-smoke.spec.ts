import { test, expect } from '@playwright/test'
import { existsSync } from 'fs'
import { join as joinPath } from 'path'

function assertUmdExists() {
  const umdPath = joinPath(
    __dirname,
    '..',
    '..',
    'browser',
    'dist',
    'umd',
    'index.js'
  )
  if (!existsSync(umdPath)) {
    throw new Error(
      `UMD bundle not found at ${umdPath}. Run 'yarn build' in packages/browser first.`
    )
  }
  return umdPath
}

const LOTAME_CDN = /https:\/\/tags\.crwdcntrl\.net\/lt\/c\/.+\/lt\.min\.js/
const LOTAME_CLIENT_ID = 'lt-999'
const COOKIE_NAME = 'lotame_profile'

test.beforeAll(() => {
  assertUmdExists()
})

test.beforeEach(async ({ page }) => {
  await page.goto('/conversion-sdk/blank.html')

  await page.route(LOTAME_CDN, async (route) => {
    const body = `
      (function mockLotame() {
        var ns = window['lotame_${LOTAME_CLIENT_ID}'];
        if (ns && ns.config && ns.config.onProfileReady) {
          ns.config.onProfileReady({
            getAudiences: function() { return ['aud-smoke-1', 'aud-smoke-2'] },
            getPanorama: function() { return { getId: function() { return 'pan-smoke-1' } } }
          });
        }
      })();
    `
    await route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body,
    })
  })

  await page.evaluate((name) => {
    document.cookie = name + '=; path=/; max-age=0'
    window.localStorage.removeItem(name)
    delete (window as unknown as Record<string, unknown>)['lotame_' + 'lt-999']
  }, COOKIE_NAME)
})

async function loadAnalyticsNext(page: import('@playwright/test').Page) {
  const umdPath = assertUmdExists()
  await page.addScriptTag({ path: umdPath })
  await page.waitForFunction(
    () => typeof (window as any).AnalyticsNext?.Analytics === 'function'
  )
}

async function registerSessionEnrichment(
  page: import('@playwright/test').Page
) {
  await page.evaluate(() => {
    const sessionPlugin = {
      name: 'session-enrichment',
      type: 'enrichment',
      version: '0.1.0',
      isLoaded: () => true,
      load: () => Promise.resolve(),
      track: (ctx: any) => {
        ctx.event.context = {
          ...ctx.event.context,
          sessionId: 'browser-session-1',
        }
        return ctx
      },
    }
    ;(window as any).__sessionPlugin = sessionPlugin
  })
}

test.describe('Lotame Analytics — browser smoke', () => {
  test('cache miss: loads LT script, writes cookie', async ({ page }) => {
    await loadAnalyticsNext(page)

    await page.evaluate(
      ({ clientId, cookieName }) => {
        const { Analytics, lotameAnalytics } = (window as any).AnalyticsNext
        const analytics = new Analytics({ writeKey: 'smoke-key' })
        const plugin = lotameAnalytics({ clientId, cookieName })
        analytics
          .register(plugin)
          .then(() => analytics.track('Smoke Test Event'))
      },
      { clientId: LOTAME_CLIENT_ID, cookieName: COOKIE_NAME }
    )

    await page.waitForFunction(
      ({ cookieName }) => Boolean(document.cookie.includes(cookieName)),
      { cookieName: COOKIE_NAME },
      { timeout: 10000 }
    )

    const cookieRaw = await page.evaluate((name) => {
      const match = document.cookie
        .split('; ')
        .find((c) => c.startsWith(name + '='))
      return match ? match.slice(name.length + 1) : null
    }, COOKIE_NAME)

    expect(cookieRaw).not.toBeNull()
    const profile = JSON.parse(decodeURIComponent(cookieRaw!))
    expect(profile.audiences).toEqual(['aud-smoke-1', 'aud-smoke-2'])
    expect(profile.panoramaId).toBe('pan-smoke-1')
    expect(typeof profile.capturedAt).toBe('string')
  })

  test('cache miss: traits enriched on events after capture', async ({
    page,
  }) => {
    await loadAnalyticsNext(page)

    const traits = await page.evaluate(
      ({ clientId, cookieName }) => {
        return new Promise((resolve) => {
          const { Analytics, lotameAnalytics } = (window as any).AnalyticsNext
          const analytics = new Analytics({ writeKey: 'smoke-key' })
          const plugin = lotameAnalytics({ clientId, cookieName })

          analytics.register(plugin).then(() => {
            analytics.track('First Event')

            const check = () => {
              const ctx = analytics.track('After Capture')
              ctx.then((c: any) => resolve(c.event.context?.traits ?? null))
            }
            setTimeout(check, 2000)
          })
        })
      },
      { clientId: LOTAME_CLIENT_ID, cookieName: COOKIE_NAME }
    )

    expect(traits).not.toBeNull()
    expect((traits as any).lotame).toMatchObject({
      audiences: ['aud-smoke-1', 'aud-smoke-2'],
      panoramaId: 'pan-smoke-1',
    })
  })

  test('cache hit: no LT script load, traits from cookie', async ({ page }) => {
    await page.evaluate(
      ({ cookieName }) => {
        const profile = {
          audiences: ['cached-aud'],
          panoramaId: 'cached-pan',
          capturedAt: new Date().toISOString(),
        }
        document.cookie = `${cookieName}=${encodeURIComponent(
          JSON.stringify(profile)
        )}; path=/; max-age=86400; SameSite=Lax`
      },
      { cookieName: COOKIE_NAME }
    )

    let lotameCdnHit = false
    await page.route(LOTAME_CDN, (route) => {
      lotameCdnHit = true
      return route.abort()
    })

    await loadAnalyticsNext(page)

    const trait = await page.evaluate(
      ({ clientId, cookieName }) => {
        return new Promise((resolve) => {
          const { Analytics, lotameAnalytics } = (window as any).AnalyticsNext
          const analytics = new Analytics({ writeKey: 'smoke-key' })
          const plugin = lotameAnalytics({ clientId, cookieName })
          const origTrack = plugin.track.bind(plugin)

          plugin.track = function (ctx: any) {
            const enriched = origTrack(ctx)
            resolve(enriched.event.context?.traits?.lotame ?? null)
            return enriched
          }

          analytics
            .register(plugin)
            .then(() => analytics.track('Cache Hit Event'))
        })
      },
      { clientId: LOTAME_CLIENT_ID, cookieName: COOKIE_NAME }
    )

    expect(lotameCdnHit).toBe(false)
    expect(trait).toMatchObject({
      audiences: ['cached-aud'],
      panoramaId: 'cached-pan',
    })
  })

  test('repeat navigation: cookie survives, no duplicate LT load', async ({
    page,
  }) => {
    await page.evaluate(
      ({ cookieName }) => {
        const profile = {
          audiences: ['repeat-aud'],
          panoramaId: 'repeat-pan',
          capturedAt: new Date().toISOString(),
        }
        document.cookie = `${cookieName}=${encodeURIComponent(
          JSON.stringify(profile)
        )}; path=/; max-age=86400; SameSite=Lax`
      },
      { cookieName: COOKIE_NAME }
    )

    let lotameLoadCount = 0
    await page.route(LOTAME_CDN, (route) => {
      lotameLoadCount++
      return route.abort()
    })

    await loadAnalyticsNext(page)
    await page.evaluate(
      ({ clientId, cookieName }) => {
        const { Analytics, lotameAnalytics } = (window as any).AnalyticsNext
        const analytics = new Analytics({ writeKey: 'smoke-key' })
        return analytics.register(lotameAnalytics({ clientId, cookieName }))
      },
      { clientId: LOTAME_CLIENT_ID, cookieName: COOKIE_NAME }
    )

    await page.reload()
    await loadAnalyticsNext(page)
    await page.evaluate(
      ({ clientId, cookieName }) => {
        const { Analytics, lotameAnalytics } = (window as any).AnalyticsNext
        const analytics = new Analytics({ writeKey: 'smoke-key' })
        return analytics.register(lotameAnalytics({ clientId, cookieName }))
      },
      { clientId: LOTAME_CLIENT_ID, cookieName: COOKIE_NAME }
    )

    expect(lotameLoadCount).toBe(0)
  })

  test('Lotame Enhanced Profile emitted exactly once on capture, no re-entrance', async ({
    page,
  }) => {
    let lotameLoadCount = 0
    await page.route(LOTAME_CDN, async (route) => {
      lotameLoadCount++
      await route.fulfill({
        status: 200,
        contentType: 'text/javascript',
        body: `
          (function mockLotame() {
            var ns = window['lotame_${LOTAME_CLIENT_ID}']
            if (ns && ns.config && ns.config.onProfileReady) {
              ns.config.onProfileReady({
                getAudiences: function() { return ['aud-smoke-1', 'aud-smoke-2'] },
                getPanorama: function() { return { getId: function() { return 'pan-smoke-1' } } }
              })
            }
          })();
        `,
      })
    })

    await loadAnalyticsNext(page)

    const { eventCount } = await page.evaluate(
      ({ clientId, cookieName }) => {
        return new Promise<{ loadCount: number; eventCount: number }>(
          (resolve) => {
            const { Analytics, lotameAnalytics } = (window as any).AnalyticsNext
            const analytics = new Analytics({ writeKey: 'smoke-key' })
            let profileEventCount = 0

            const origTrack = analytics.track.bind(analytics)
            analytics.track = function (...args: any[]) {
              if (args[0] === 'Lotame Enhanced Profile') profileEventCount++
              return origTrack(...args)
            }

            const plugin = lotameAnalytics({ clientId, cookieName })
            analytics.register(plugin).then(() => {
              analytics.track('Trigger Capture')
              setTimeout(() => {
                analytics.track('Second Event')
                setTimeout(
                  () =>
                    resolve({ loadCount: 1, eventCount: profileEventCount }),
                  500
                )
              }, 1500)
            })
          }
        )
      },
      { clientId: LOTAME_CLIENT_ID, cookieName: COOKIE_NAME }
    )

    expect(lotameLoadCount).toBe(1)
    expect(eventCount).toBe(1)
  })

  test('sessionId accompanies lotame traits on same event', async ({
    page,
  }) => {
    await registerSessionEnrichment(page)
    await loadAnalyticsNext(page)

    const ctxData = await page.evaluate(
      ({ clientId, cookieName }) => {
        return new Promise<any>((resolve) => {
          const { Analytics, lotameAnalytics } = (window as any).AnalyticsNext
          const analytics = new Analytics({ writeKey: 'smoke-key' })

          const sessionPlugin = (window as any).__sessionPlugin
          analytics.register(sessionPlugin).then(() => {
            const plugin = lotameAnalytics({ clientId, cookieName })
            analytics.register(plugin).then(() => {
              const check = () => {
                const c = analytics.track('Joint Event')
                c.then((ctx: any) =>
                  resolve({
                    sessionId: ctx.event.context?.sessionId,
                    traits: ctx.event.context?.traits,
                  })
                )
              }
              setTimeout(check, 2000)
            })
          })
        })
      },
      { clientId: LOTAME_CLIENT_ID, cookieName: COOKIE_NAME }
    )

    expect(ctxData.sessionId).toBe('browser-session-1')
    expect(ctxData.traits).toBeDefined()
    expect(ctxData.traits.lotame).toMatchObject({
      audiences: ['aud-smoke-1', 'aud-smoke-2'],
      panoramaId: 'pan-smoke-1',
    })
  })
})
