import { Page } from '@playwright/test'

export const logConsole = (page: Page) => {
  const CONSOLE_BLACKLIST = ['Bad Request']
  page.on('console', (msg) => {
    const text = msg.text()
    // keep stdout clean, e.g. by not printing intentional errors
    if (CONSOLE_BLACKLIST.some((str) => text.includes(str))) {
      return
    }
    console.log(`console.${msg.type()}:`, text)
  })
  page.on('pageerror', (error) => {
    console.error('Page error:', error)
  })
}
