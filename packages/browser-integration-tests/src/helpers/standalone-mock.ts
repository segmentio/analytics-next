import { join as joinPath } from 'path'
import {
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
} from '@playwright/test'

type BeforeEachFn = (
  args: PlaywrightTestArgs &
    PlaywrightTestOptions &
    PlaywrightWorkerArgs &
    PlaywrightWorkerOptions
) => Promise<void>

export const standaloneMock: BeforeEachFn = async ({ context }) => {
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
    (route, request) => {
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
    (route, request) => {
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
