import { BasePage } from './base-page'
import { Locator, Page } from '@playwright/test'

export default class OneTrustPage extends BasePage {
  constructor(page: Page) {
    super(page, 'consent-tools-onetrust.html')
  }

  async openAlertBoxIfNeeded() {
    const floatingButton = this.page.locator('#ot-sdk-btn-floating')
    try {
      // Wait for the button to exist for up to 2 seconds
      await floatingButton.waitFor({ timeout: 2000 })
      await floatingButton.click()
    } catch (error) {
      // If the button does not exist or is not visible, do nothing.
    }
  }

  async clickConfirmButtonAndClosePopup() {
    const confirmButton = await this.findFirstVisibleElement([
      'button:has-text("Confirm")',
      '#onetrust-accept-btn-handler',
    ])

    if (confirmButton) {
      await confirmButton.click()
    }
  }

  private async findFirstVisibleElement(
    selectors: string[]
  ): Promise<Locator | undefined> {
    for (const selector of selectors) {
      const locator = this.page.locator(selector)
      if (await locator.isVisible()) {
        return locator
      }
    }
  }
}
