import { BasePage } from './base-page'
import { Page } from '@playwright/test'

export default class OneTrustPage extends BasePage {
  constructor(page: Page) {
    super(page, 'consent-tools-onetrust.html')
  }

  async clickAcceptButtonAndClosePopup() {
    const acceptButton = await this.page.locator('#onetrust-accept-btn-handler')
    await acceptButton.click()
  }
}

//export default (page: Page) => new OneTrustPage(page)
