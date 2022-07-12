import type { Inspector } from '@segment/inspector-core'
import { getGlobal } from '../../lib/get-global'

declare global {
  interface Window {
    __SEGMENT_INSPECTOR__?: Inspector
  }
}

const env = getGlobal()

export const inspectorHost: Inspector = {
  start: (...args) => (env as any)?.['__SEGMENT_INSPECTOR__']?.start(...args),
  trace: (...args) => (env as any)?.['__SEGMENT_INSPECTOR__']?.trace(...args),
}
