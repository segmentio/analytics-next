import playwright, { Browser } from 'playwright'

const debug = process.env.DEBUG ?? false

let br: Browser
export async function browser(): Promise<Browser> {
  if (!br) {
    br = await playwright.chromium.launch({
      devtools: true,
      headless: !debug,
    })
  }

  return br
}

!debug &&
  process.on('exit', async () => {
    await br?.close()
  })
