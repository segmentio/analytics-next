import type { PlaywrightTestConfig } from '@playwright/test'
import { devices } from '@playwright/test'
import path from 'path'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  webServer: {
    command: 'yarn serve',
    url: 'http://127.0.0.1:5432',
    reuseExistingServer: !process.env.CI,
  },
  testDir: './src/tests',
  globalSetup: path.resolve(__dirname, 'playwright.global-setup.ts'),
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { open: 'never' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    baseURL: `http://127.0.0.1:5432`,
    trace: 'on',

    /* In CI, use the apk-installed system Chromium (.buildkite/Dockerfile.agent)
     * instead of a Playwright-downloaded binary -- unreachable from locked-down
     * agents. Undefined locally, so local dev keeps Playwright's managed browser. */
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        },
      },
    },
  ],
}

export default config
