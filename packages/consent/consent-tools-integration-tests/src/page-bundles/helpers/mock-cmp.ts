const constants = {
  giveConsentId: 'give-consent',
  denyConsentId: 'deny-consent',
}
export type MockConsentManager = ReturnType<typeof initMockConsentManager>

declare global {
  interface Window {
    MockCMP: MockConsentManager
  }
}
type ConsentChangeFn = (categories: Record<string, boolean>) => void

/**
 * This is a mock consent manager that simulates a consent manager that is loaded asynchronously.
 * Similar to OneTrust, TrustArc, etc.
 * sets a global `window.MockCMP` object that can be used to interact with the mock consent manager.
 */
export const initMockConsentManager = (settings: { consentModel: string }) => {
  const isOptIn = settings.consentModel === 'opt-in'
  // if opt-in is true, all categories are set to true by default
  let categories = {
    FooCategory1: isOptIn,
    FooCategory2: isOptIn,
  }
  console.log('initMockConsentManager', settings, categories)

  let onConsentChange = (_categories: Record<string, boolean>) =>
    undefined as void

  const createAlertBox = () => {
    const container = document.createElement('div')
    container.id = 'alert-box'
    container.innerHTML = `
      <button id="${constants.giveConsentId}">Give consent</button>
      <button id="${constants.denyConsentId}">Deny consent</button>
      `
    return container
  }

  const alertBox = createAlertBox()
  let loaded = false
  setTimeout(() => {
    loaded = true
    mockCMPPublicAPI.openAlertBox()
  }, 300)

  /**
   * similar to window.OneTrust
   */
  const mockCMPPublicAPI = {
    get isLoaded() {
      return loaded
    },
    get consentModel() {
      return settings.consentModel
    },
    setCategories: (newCategories: Record<string, boolean>) => {
      categories = { ...categories, ...newCategories }
      onConsentChange(categories)
      return categories
    },
    waitForAlertBoxClose() {
      return new Promise<void>((resolve) => {
        document
          .getElementById('give-consent')!
          .addEventListener('click', () => {
            resolve()
          })

        document
          .getElementById('deny-consent')!
          .addEventListener('click', () => {
            resolve()
          })
      })
    },
    getCategories: () => categories,
    openAlertBox: () => {
      document.body.appendChild(alertBox)
      document
        .getElementById(constants.giveConsentId)!
        .addEventListener('click', () => {
          mockCMPPublicAPI.setCategories({
            FooCategory1: true,
            FooCategory2: true,
          })
          mockCMPPublicAPI.closeAlertBox()
        })
      document
        .getElementById(constants.denyConsentId)!
        .addEventListener('click', () => {
          mockCMPPublicAPI.setCategories({
            FooCategory1: false,
            FooCategory2: false,
          })
          mockCMPPublicAPI.closeAlertBox()
        })
    },
    closeAlertBox: () => {
      document.body.removeChild(alertBox)
    },
    onConsentChange: (fn: ConsentChangeFn) => {
      onConsentChange = (...args: Parameters<ConsentChangeFn>) => {
        console.log('Consent Changed', args)
        fn(...args)
      }
    },
  }
  window.MockCMP = mockCMPPublicAPI
  return mockCMPPublicAPI
}
