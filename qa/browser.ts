import playwright, { Browser } from 'playwright'

let br: Browser
export async function browser(): Promise<Browser> {
  if (!br) {
    br = await playwright.chromium.launch({
      devtools: true,
      headless: true,
    })
  }

  return br
}

process.on('exit', async () => {
  await br?.close()
})
