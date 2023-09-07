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

  /**
   * Whenever a consent event is sent, increment a counter
   */
  detectConsentChanged() {
    const getConsentChangedCallCount = (): Promise<number> =>
      browser.execute(() => window._segmentConsentCalls)

    void browser.execute(() => {
      window._segmentConsentCalls ??= 0
      window.analytics.on('track', (name) => {
        if (name.includes('Segment Consent')) {
          window._segmentConsentCalls += 1
        }
      })
    })
    return { getConsentChangedCallCount }
  }
}

export default new OneTrustPage()
