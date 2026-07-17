import playwright, { Browser } from 'playwright'

const debug = process.env.DEBUG ?? false

let br: Browser
export async function browser(): Promise<Browser> {
  if (!br) {
    br = await playwright.chromium.launch({
      headless: !debug,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-zygote',
        '--disable-gpu',
        ...(debug ? ['--auto-open-devtools-for-tabs'] : []),
      ],
    })
  }

  return br
}

!debug &&
  process.on('exit', async () => {
    await br?.close()
  })
