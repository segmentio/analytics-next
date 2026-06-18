import { Analytics } from '../../core/analytics'
import { Context } from '../../core/context'
import { toFacade } from '../../lib/to-facade'
import type { CollectEvent } from './types'

const SUPPORTED_TYPES = new Set(['track', 'page', 'identify', 'screen'])

/**
 * Maps an analytics-next context to the native Segment collect payload (no SDK-side flatten).
 */
export function contextToCollectEvent(
  ctx: Context,
  _analytics: Analytics
): CollectEvent | null {
  const json = toFacade(ctx.event).json() as CollectEvent
  if (!json.type || !SUPPORTED_TYPES.has(String(json.type))) {
    return null
  }
  return { ...json }
}
