import { Page } from '@playwright/test'

export const logConsole = (page: Page) => {
  page.on('console', (msg) => {
    const CONSOLE_BLACKLIST = ['Bad Request']
    const text = msg.text()
    // do not print errors that are expected -- e.g. network errors set up to test the unhappy path.
    if (CONSOLE_BLACKLIST.some((str) => text.includes(str))) {
      return
    }
    console.log(`console.${msg.type()}:`, text)
  })
  page.on('pageerror', (error) => {
    console.error('Page error:', error)
  })
}
