import { getCDN } from './lib/parse-cdn'

if (process.env.ASSET_PATH) {
  if (process.env.ASSET_PATH === '/dist/umd/') {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/camelcase
    __webpack_public_path__ = '/dist/umd/'
  } else {
    const cdn = getCDN()
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/camelcase
    __webpack_public_path__ = cdn
      ? cdn + '/analytics-next/bundles/'
      : 'https://cdn.segment.com/analytics-next/bundles/'
  }
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

function shouldPolyfill(): boolean {
  const browserVersionCompatList: { [browser: string]: number } = {
    Firefox: 46,
    Edge: 13,
  }

  // Unfortunately IE doesn't follow the same pattern as other browsers, so we
  // need to check `isIE11` differently.
  // @ts-expect-error
  const isIE11 = !!window.MSInputMethodContext && !!document.documentMode

  const userAgent = navigator.userAgent.split(' ')
  const [browser, version] = userAgent[userAgent.length - 1].split('/')

  return (
    isIE11 ||
    (browserVersionCompatList[browser] !== undefined &&
      browserVersionCompatList[browser] >= parseInt(version))
  )
}

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

if (shouldPolyfill()) {
  // load polyfills in order to get AJS to work with old browsers
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

// appName = Netscape IE / Edge

// edge 13 Edge/13... same as FF
