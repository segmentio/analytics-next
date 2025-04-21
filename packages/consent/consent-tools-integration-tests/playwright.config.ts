import type { PlaywrightTestConfig } from '@playwright/test'

const PORT = 4567
const config: PlaywrightTestConfig = {
  testDir: './src/tests',
  timeout: 30000,
  retries: 1,
  webServer: {
    command: 'yarn http-server public -p 4567',
    port: 4567,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    baseURL: `http://localhost:${PORT}`,
    video: {
      mode: 'off',
      size: { width: 640, height: 480 },
    },
  },
}

export default config
