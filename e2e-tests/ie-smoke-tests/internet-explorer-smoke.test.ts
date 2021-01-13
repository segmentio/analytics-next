import { remote } from 'webdriverio'
import ngrok from 'ngrok'
import URL from 'url'
import execa from 'execa'
import { startLocalServer } from '../recorder/localServer'

const sauceKey = (): string => {
  return (
    process.env.SAUCELABS_KEY ??
    execa.commandSync(
      'aws-okta exec dev-write -- chamber read -q analytics-next saucelabs-key'
    ).stdout
  )
}

const config: WebdriverIO.RemoteOptions = {
  user: 'segment',
  key: sauceKey(),
  region: 'us',
  maxInstances: 10,
  bail: 0,
  logLevel: 'warn',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  services: ['sauce'],
  capabilities: {
    browserName: 'internet explorer',
    browserVersion: '11.285',
    platformName: 'Windows 10',
    'sauce:options': {},
  },
}

jest.setTimeout(100000)

async function startServer(): Promise<URL.UrlWithStringQuery> {
  const url = await startLocalServer()
  return URL.parse(url)
}

describe('💩 Internet Explorer', () => {
  it('can load analytics-next and send a track call', async () => {
    const { port } = await startServer()
    const url = await ngrok.connect(parseInt(port ?? '5000', 10))

    const browser = await remote({
      ...config,
    })

    await browser.url(`${url}/example/snippet_example/index-local`)

    await browser.waitUntil(async () => {
      const logs = await browser.$('#ready-logs')
      const text = await logs.getText()
      return text !== ''
    })

    const trackBtn = await browser.$('#track')
    await trackBtn.click()

    // wait until the event goes through
    await browser.waitUntil(async () => {
      const logs = await browser.$('#logs')
      const text = await logs.getText()
      return text !== ''
    })

    await ngrok.kill()
    await browser.deleteSession()
  })
})
