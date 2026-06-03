import type { Analytics } from '../core/analytics'
import { getConversionCollectorBuffer } from '../plugins/conversion-collector/runtime-registry'
import type { BatchBuffer } from '../plugins/conversion-collector/batch-buffer'

export function resolveCollectorBuffer(
  analytics: Analytics
): BatchBuffer | undefined {
  return getConversionCollectorBuffer(analytics)
}

export function flushCollectorQueue(analytics: Analytics): Promise<void> {
  return getConversionCollectorBuffer(analytics)?.flush() ?? Promise.resolve()
}

export async function stopCollectorQueue(analytics: Analytics): Promise<void> {
  const buffer = getConversionCollectorBuffer(analytics)
  buffer?.stop()
  if (buffer?.flushAll) {
    await buffer.flushAll()
    return
  }
  await buffer?.flush()
}
