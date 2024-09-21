import { Page } from '@playwright/test'

export const logConsole = (page: Page) => {
  page.on('console', (msg) => {
    console.log(`console.${msg.type()}:`, msg.text())
  })
  page.on('pageerror', (error) => {
    console.error('Page error:', error)
  })
}
