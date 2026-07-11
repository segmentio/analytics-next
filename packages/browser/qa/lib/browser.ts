import playwright, { Browser } from 'playwright'

const debug = process.env.DEBUG ?? false

let br: Browser
export async function browser(): Promise<Browser> {
  if (!br) {
    br = await playwright.chromium.launch({
      // In CI this points at the apk-installed system Chromium (see
      // .buildkite/Dockerfile.agent) instead of a Playwright-downloaded binary,
      // which isn't reachable from locked-down agents. Undefined locally, so
      // local dev keeps using Playwright's own managed browser.
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      devtools: true,
      headless: !debug,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-zygote',
        '--disable-gpu',
      ],
    })
  }

  return br
}

!debug &&
  process.on('exit', async () => {
    await br?.close()
  })
