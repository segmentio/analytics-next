/* eslint-disable @typescript-eslint/no-floating-promises */
import { getCDN, setGlobalCDNUrl } from '../lib/parse-cdn'
import { setVersionType } from '../plugins/segmentio/normalize'

if (process.env.ASSET_PATH) {
  if (process.env.ASSET_PATH === '/dist/umd/') {
    // @ts-ignore
    __webpack_public_path__ = '/dist/umd/'
  } else {
    const cdn = getCDN()
    setGlobalCDNUrl(cdn)

    // @ts-ignore
    __webpack_public_path__ = cdn
      ? cdn + '/analytics-next/bundles/'
      : 'https://cdn.segment.com/analytics-next/bundles/'
  }
}

setVersionType('web')

import { install } from './standalone-analytics'
import '../lib/csp-detection'
import { shouldPolyfill } from '../lib/browser-polyfill'
import { RemoteMetrics } from '../core/stats/remote-metrics'
import { embeddedWriteKey } from '../lib/embedded-write-key'
import {
  loadAjsClassicFallback,
  isAnalyticsCSPError,
} from '../lib/csp-detection'

let ajsIdentifiedCSP = false

const sendErrorMetrics = (tags: string[]) => {
  // this should not be instantied at the root, or it will break ie11.
  const metrics = new RemoteMetrics()
  metrics.increment('analytics_js.invoke.error', [
    ...tags,
    `wk:${embeddedWriteKey()}`,
  ])
}

function onError(err?: unknown) {
  console.error('[analytics.js]', 'Failed to load Analytics.js', err)
  sendErrorMetrics([
    'type:initialization',
    ...(err instanceof Error
      ? [`message:${err?.message}`, `name:${err?.name}`]
      : []),
  ])
}

document.addEventListener('securitypolicyviolation', (e) => {
  if (ajsIdentifiedCSP || !isAnalyticsCSPError(e)) {
    return
  }
  ajsIdentifiedCSP = true
  sendErrorMetrics(['type:csp'])
  loadAjsClassicFallback().catch(console.error)
})

/**
 * Attempts to run a promise and catch both sync and async errors.
 **/
async function attempt<T>(promise: () => Promise<T>) {
  try {
    const result = await promise()
    return result
  } catch (err) {
    onError(err)
  }
}

if (shouldPolyfill()) {
  // load polyfills in order to get AJS to work with old browsers
  const script = document.createElement('script')
  script.setAttribute(
    'src', // this should map to tsconfig lib. always,gated mean "always download all polyfills from the server, but only load them if a polyfill does not exist"
    'https://polyfill.io/v3/polyfill.min.js?features=es5,es2015,es2016,es2017,es2018,es2019,es2020&flags=always,gated'
  )

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () =>
      document.body.appendChild(script)
    )
  } else {
    document.body.appendChild(script)
  }

  script.onload = function (): void {
    attempt(install)
  }
} else {
  attempt(install)
}
