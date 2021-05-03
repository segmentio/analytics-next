if (process.env.ASSET_PATH) {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/camelcase
  __webpack_public_path__ = process.env.ASSET_PATH
}

import { loadScript } from './lib/load-script'
import { install } from './standalone-analytics'

const regex = /(https:\/\/.*)\/analytics\.js\/v1\/(?:.*?)\/(?:platform|analytics.*)?/

function getScriptPath(): string {
  const scripts = Array.from(document.querySelectorAll('script'))
  let path: string | undefined = undefined

  for (const s of scripts) {
    const src = s.getAttribute('src') ?? ''
    const result = regex.exec(src)

    if (result && result[1]) {
      path = src
      break
    }
  }

  if (path) {
    return path.replace('analytics.min.js', 'analytics.classic.js')
  }

  return `https://cdn.segment.com/analytics.js/v1/${window.analytics._writeKey}/analytics.classic.js`
}

let identifiedCSP = false

async function onCSPError(e: SecurityPolicyViolationEvent): Promise<void> {
  if (!e.blockedURI.includes('cdn.segment') || identifiedCSP) {
    return
  }

  identifiedCSP = true

  console.warn(
    'Your CSP policy is missing permissions required in order to run Analytics.js 2.0'
  )
  console.warn('Reverting to Analytics.js 1.0')

  const classicPath = getScriptPath()
  await loadScript(classicPath)
}

document.addEventListener('securitypolicyviolation', (e) => {
  onCSPError(e).catch(console.error)
})

// @ts-expect-error
const isIE11 = !!window.MSInputMethodContext && !!document.documentMode
if (isIE11) {
  // load polyfills in order to get AJS to work with IE11
  const script = document.createElement('script')
  script.setAttribute(
    'src',
    'https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/7.7.0/polyfill.min.js'
  )
  document.body.appendChild(script)

  script.onload = function (): void {
    install().catch(console.error)
  }
} else {
  install().catch(console.error)
}
