import { BasePage } from './base-page'

class OneTrustPage extends BasePage {
  constructor() {
    super('onetrust.html')
  }

  get isOneTrustLoaded(): Promise<void> {
    // @ts-ignore
    return window.isOneTrustLoaded
  }

  clickAcceptButtonAndClosePopup() {
    return $('#onetrust-accept-btn-handler').click()
  }
}

export default new OneTrustPage()
