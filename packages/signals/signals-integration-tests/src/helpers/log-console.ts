import { Page } from '@playwright/test'

export const logConsole = (page: Page) => {
  page.on('console', (msg) => {
    const text = msg.text()
    // keep stdout clean, e.g. by not printing intentional errors
    const blacklist = ['Bad Request']
    if (blacklist.some((str) => text.includes(str))) {
      return
    }
    console.log(`console.${msg.type()}:`, text)
  })
  page.on('pageerror', (error) => {
    console.error('Page error:', error)
  })
}
