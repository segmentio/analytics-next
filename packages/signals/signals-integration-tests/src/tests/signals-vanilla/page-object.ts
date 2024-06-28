import { BasePage } from '../../helpers/base-page'
import path from 'path'
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
    super(`file://${path.resolve(__dirname, 'index.html')}`, edgeFn)
  }
  async makeAnalyticsPageCall(): Promise<unknown> {
    const p = this.page.evaluate(() => {
      void window.analytics.page()
      return new Promise((resolve) => window.analytics.on('page', resolve))
    })
    return promiseTimeout(p, 2000, 'analytics.on("page") did not resolve')
  }
}
