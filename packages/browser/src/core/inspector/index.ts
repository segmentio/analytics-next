import type { Inspector } from '@segment/inspector-core'

declare global {
  interface Window {
    __SEGMENT_INSPECTOR__?: Inspector
  }
}

// FIXME: Replace this with `globalThis` to support all environments
const env = typeof window !== 'undefined' ? window : null

export const inspectorHost: Inspector = {
  start: (...args) => (env as any)?.['__SEGMENT_INSPECTOR__']?.start(...args),
  trace: (...args) => (env as any)?.['__SEGMENT_INSPECTOR__']?.trace(...args),
}
