import { BasePage } from '../../helpers/base-page-object'
import { promiseTimeout } from '@internal/test-helpers'
import { fillAndBlur } from '../../helpers/playwright-utils'

export class IndexPage extends BasePage {
  constructor() {
    super(`/signals-vanilla/index.html`)
  }

  async makeAnalyticsPageCall(): Promise<unknown> {
    const p = this.page.evaluate(() => {
      void window.analytics.page()
      return new Promise((resolve) => window.analytics.on('page', resolve))
    })
    return promiseTimeout(p, 2000, 'analytics.on("page") did not resolve')
  }

  async makeAnalyticsTrackCall(): Promise<unknown> {
    const p = this.page.evaluate(() => {
      void window.analytics.track('some event')
      return new Promise((resolve) => window.analytics.on('track', resolve))
    })
    return promiseTimeout(p, 2000, 'analytics.on("track") did not resolve')
  }

  addUserDefinedSignal(data?: Record<string, unknown>) {
    return this.page.evaluate(
      (args) => {
        window.signalsPlugin.addSignal({
          foo: 'bar',
          ...args.data,
        })
      },
      { data }
    )
  }

  async clickButton() {
    return this.page.click('#some-button')
  }

  async clickComplexButton() {}

  async clickInsideComplexButton() {
    return this.page.click('#complex-button h1')
  }

  async fillNameInput(text: string) {
    return await fillAndBlur(this.page, '#name', text)
  }
}
