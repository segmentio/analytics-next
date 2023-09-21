import { getGlobal } from '../../lib/get-global'
import type { Attribution } from '../analytics'

const env = getGlobal()

// The code below assumes the inspector extension will use Object.assign
// to add the inspect interface on to this object reference (unless the
// extension code ran first and has already set up the variable)
const inspectorHost: {
  attach: (analytics: Attribution) => void
} = ((env as any)['__SEGMENT_INSPECTOR__'] ??= {})

export const attachInspector = (analytics: Attribution) =>
  inspectorHost.attach?.(analytics as any)
