import { createWrapper, resolveWhen } from '@segment/analytics-consent-tools'

export const withMockCMP = (analyticsInstance: any) =>
  createWrapper({
    enableDebugLogging: true,
    shouldLoadWrapper: async () => {
      await resolveWhen(() => window.MockCMP.isLoaded, 500)
    },
    getCategories: () => window.MockCMP.getCategories(),
    registerOnConsentChanged: (fn) => {
      window.MockCMP.onConsentChange(fn)
    },
    shouldLoadSegment: async (ctx) => {
      if (window.MockCMP.consentModel === 'opt-out') {
        // if opt out, load immediately
        return ctx.load({ consentModel: 'opt-out' })
      }
      await window.MockCMP.waitForAlertBoxClose()
      ctx.load({ consentModel: 'opt-in' })
    },
  })(analyticsInstance)
