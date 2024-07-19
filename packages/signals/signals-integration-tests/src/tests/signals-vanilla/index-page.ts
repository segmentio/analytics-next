import { BasePage } from '../../helpers/base-page-object'
import { promiseTimeout } from '@internal/test-helpers'

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

  addUserDefinedSignal() {
    return this.page.evaluate(() => {
      window.signalsPlugin.addSignal({
        type: 'userDefined',
        data: {
          foo: 'bar',
        },
      })
    })
  }

  async mockRandomJSONApi() {
    await this.page.route('http://localhost:5432/api/foo', (route) => {
      return route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          someResponse: 'yep',
        }),
      })
    })
  }

  async makeFetchCallToRandomJSONApi(): Promise<void> {
    return this.page.evaluate(() => {
      return fetch('http://localhost:5432/api/foo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ foo: 'bar' }),
      })
        .then(console.log)
        .catch(console.error)
    })
  }

  async clickButton() {
    return this.page.click('#some-button')
  }
}
