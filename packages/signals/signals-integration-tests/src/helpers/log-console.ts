import { Page } from '@playwright/test'

export const logConsole = (page: Page) => {
  page.on('console', (msg) => {
    console.log(`[${msg.type()}]`, msg.text())
  })
}
