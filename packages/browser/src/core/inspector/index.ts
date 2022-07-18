import type { InspectBroker } from '@segment/inspector-webext'
import { getGlobal } from '../../lib/get-global'

declare global {
  interface Window {
    __SEGMENT_INSPECTOR__: Partial<InspectBroker>
  }
}

const env = getGlobal()

// The code below assumes the inspector extension will use Object.assign
// to add the inspect interface on to this object reference (unless the
// extension code ran first and has already set up the variable)
export const inspectorHost: Partial<InspectBroker> = ((env as any)[
  '__SEGMENT_INSPECTOR__'
] ??= {})
