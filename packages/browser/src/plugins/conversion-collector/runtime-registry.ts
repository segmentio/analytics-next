import { Analytics } from '../../core/analytics'
import { BatchBuffer } from './batch-buffer'

const buffers = new WeakMap<Analytics, BatchBuffer>()

export function registerConversionCollectorBuffer(
  analytics: Analytics,
  buffer: BatchBuffer
): void {
  buffers.set(analytics, buffer)
}

export function getConversionCollectorBuffer(
  analytics: Analytics
): BatchBuffer | undefined {
  return buffers.get(analytics)
}
