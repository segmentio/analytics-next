import { loadScript } from './load-script'
import { getLegacyAJSPath } from './parse-cdn'

let identifiedCSP = false
export async function onCSPError(
  e: SecurityPolicyViolationEvent
): Promise<void> {
  if (!e.blockedURI.includes('cdn.segment') || identifiedCSP) {
    return
  }

  identifiedCSP = true

  console.warn(
    'Your CSP policy is missing permissions required in order to run Analytics.js 2.0'
  )
  console.warn('Reverting to Analytics.js 1.0')

  const classicPath = getLegacyAJSPath()
  await loadScript(classicPath)
}
