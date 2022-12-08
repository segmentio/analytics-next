import type { InspectBroker } from '@segment/inspector-webext'
import { getGlobal } from '../../lib/get-global'
import type { Analytics } from '../analytics'

declare global {
  interface Window {
    __SEGMENT_INSPECTOR__: Partial<InspectBroker>
  }
}

const env = getGlobal()

// The code below assumes the inspector extension will use Object.assign
// to add the inspect interface on to this object reference (unless the
// extension code ran first and has already set up the variable)
const inspectorHost: Partial<InspectBroker> = ((env as any)[
  '__SEGMENT_INSPECTOR__'
] ??= {})

export const attachInspector = (analytics: Analytics) => {
  inspectorHost.attach?.(analytics as any)

  analytics.on('dispatch_start', (ctx) => inspectorHost.triggered?.(ctx))

  analytics.queue.on('message_enriched', (ctx) => inspectorHost.enriched?.(ctx))

  analytics.queue.on('message_delivered', (ctx) =>
    // FIXME: Resolve browsers destinations that the event was sent to
    inspectorHost.delivered?.(ctx, ['segment.io'])
  )
}
