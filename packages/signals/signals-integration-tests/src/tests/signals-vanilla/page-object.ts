import { BasePage } from '../../helpers/base-page'
import path from 'path'
import { promiseTimeout } from '@internal/test-helpers'

export class IndexPage extends BasePage {
  constructor() {
    super(`file://${path.resolve(__dirname, 'index.html')}`)
  }
  async makeAnalyticsPageCall(): Promise<unknown> {
    const p = this.page.evaluate(() => {
      void window.analytics.page()
      return new Promise((resolve) => window.analytics.on('page', resolve))
    })
    return promiseTimeout(p, 2000, 'analytics.on("page") did not resolve')
  }
}
