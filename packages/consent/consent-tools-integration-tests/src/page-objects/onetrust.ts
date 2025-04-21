import { Page } from '@playwright/test'
import { BasePage } from './base-page'

export class OneTrustPage extends BasePage {
  constructor(page: Page) {
    super(page, 'onetrust.html')
  }

  // Check if OneTrust is loaded by evaluating a global variable on the page
  async isOneTrustLoaded() {
    // To Do
  }

  //Click the OneTrust accept button
  async clickAcceptButtonAndClosePopup() {
    // To Do
  }
}
