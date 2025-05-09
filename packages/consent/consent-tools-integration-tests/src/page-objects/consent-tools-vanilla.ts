import { Page } from '@playwright/test'
import { BasePage } from './base-page'

export class ConsentToolsVanilla extends BasePage {
  constructor(page: Page, file: string) {
    super(page, file)
  }

  async clickGiveConsent() {
    await this.page.locator('#give-consent').click()
  }

  async clickDenyConsent() {
    await this.page.locator('#deny-consent').click()
  }
}

export class ConsentToolsVanillaOptOut extends ConsentToolsVanilla {
  constructor(page: Page) {
    super(page, 'consent-tools-vanilla-opt-out.html')
  }
}

export class ConsentToolsVanillaOptIn extends ConsentToolsVanilla {
  constructor(page: Page) {
    super(page, 'consent-tools-vanilla-opt-in.html')
  }
}
