import { Page } from '@playwright/test'

export const logConsole = (page: Page) => {
  page.on('console', (msg) => {
    const text = msg.text()
    if (text.includes('NAME_NOT_RESOLVED')) {
      // dns error spam started showing up -- either a chrome change or a vpn issue
      return
    }
    console.log(`console.${msg.type()}:`, text)
  })
  page.on('pageerror', (error) => {
    console.error('Page error:', error, `[name]: ${error.name}`)
  })
}
