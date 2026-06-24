import { join as joinPath } from 'path'
import type { BrowserContext, Request, Route } from '@playwright/test'

type BeforeEachArgs = { context: BrowserContext }

export const standaloneMock = async ({ context }: BeforeEachArgs) => {
  // Setup routing to monorepo
  const ajsBasePath = joinPath(
    __dirname,
    '..',
    '..',
    'node_modules',
    '@segment',
    'analytics-next',
    'dist',
    'umd'
  )
  await context.route(
    'https://cdn.segment.com/analytics.js/v1/*/analytics.min.js',
    (route: Route, request: Request) => {
      if (request.method().toLowerCase() !== 'get') {
        return route.continue()
      }

      return route.fulfill({
        path: joinPath(ajsBasePath, 'standalone.js'),
        status: 200,
        headers: {
          'Content-Type': 'text/javascript',
        },
      })
    }
  )

  await context.route(
    'https://cdn.segment.com/analytics-next/bundles/*',
    (route: Route, request: Request) => {
      if (request.method().toLowerCase() !== 'get') {
        return route.continue()
      }

      const filename = request.url().split('/').pop()!
      return route.fulfill({
        path: joinPath(ajsBasePath, filename),
        status: 200,
        headers: {
          'Content-Type': 'text/javascript',
        },
      })
    }
  )
}
