// page-objects/onetrust.ts
import { Page } from '@playwright/test'
import { BasePage } from './base-page'

class OneTrustPage extends BasePage {
  constructor(page: Page) {
    super(page, 'consent-tools-onetrust.html')
  }

  // Check for global variable `window.isOneTrustLoaded`
  async isOneTrustLoaded(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return Boolean((window as any).isOneTrustLoaded)
    })
  }

  async clickGiveConsent() {
    //await this.page.click('#onetrust-accept-btn-handler')
    const acceptButton = this.page.locator('#onetrust-accept-btn-handler')
    await acceptButton.waitFor({ state: 'visible' }) // Ensure the button is visible
    await acceptButton.click()
  }

  async clickDenyConsent() {
    const rejectButton = await this.page.locator('#onetrust-reject-all-handler')
    await rejectButton.waitFor({ state: 'visible' }) // Ensure the button is visible
    await rejectButton.click()
  }
}

export class OneTrustConsentPage extends OneTrustPage {
  constructor(page: Page) {
    super(page)
  }
}
