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
import { loadAjsClassicFallback } from '../lib/csp-detection'

let ajsIdentifiedCSP = false

type CSPErrorEvent = SecurityPolicyViolationEvent & {
  disposition?: 'enforce' | 'report'
}

export const isAJSCSPError = (e: CSPErrorEvent) => {
  if (e.disposition === 'report' || !e.blockedURI.includes('cdn.segment')) {
    return false
  }

  return true
}

function onError(err?: unknown) {
  console.error('[analytics.js]', 'Failed to load Analytics.js', err)

  new RemoteMetrics().increment('analytics_js.invoke.error', [
    'type:initialization',
    ...(err instanceof Error
      ? [`message:${err?.message}`, `name:${err?.name}`]
      : []),
    `wk:${embeddedWriteKey()}`,
  ])
}

document.addEventListener('securitypolicyviolation', (e) => {
  if (ajsIdentifiedCSP || !isAJSCSPError(e)) {
    return
  }
  ajsIdentifiedCSP = true
  new RemoteMetrics().increment('analytics_js.invoke.error', [
    'type:csp',
    `wk:${embeddedWriteKey()}`,
  ])
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
    'src',
    'https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/7.7.0/polyfill.min.js'
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
