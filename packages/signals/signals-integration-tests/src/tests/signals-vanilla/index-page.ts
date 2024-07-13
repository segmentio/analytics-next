import { BasePage } from '../../helpers/base-page-object'
import { promiseTimeout } from '@internal/test-helpers'

const edgeFn = `
    // this is a process signal function
    const processSignal = (signal) => {
      if (signal.type === 'interaction') {
        const eventName = signal.data.eventType + ' ' + '[' + signal.type + ']'
        analytics.track(eventName, signal.data)
      }
  }`

export class IndexPage extends BasePage {
  constructor() {
    super(`/signals-vanilla/index.html`, edgeFn)
  }
  async makeAnalyticsPageCall(): Promise<unknown> {
    const p = this.page.evaluate(() => {
      void window.analytics.page()
      return new Promise((resolve) => window.analytics.on('page', resolve))
    })
    return promiseTimeout(p, 2000, 'analytics.on("page") did not resolve')
  }

  async mockRandomJSONApi() {
    await this.page.route('http://localhost:3000/api/foo', (route) => {
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
      return fetch('http://localhost:3000/api/foo', {
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
}
