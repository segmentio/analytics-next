import { Analytics } from '../../core/analytics'
import { Context } from '../../core/context'
import { Plugin } from '../../core/plugin'
import { BatchBuffer } from './batch-buffer'
import { contextToEnvelope } from './context-to-envelope'
import { registerConversionCollectorBuffer } from './runtime-registry'
import type { ConversionCollectorSettings } from './types'

const DEFAULT_FLUSH_INTERVAL_MS = 2000
const DEFAULT_BATCH_SIZE = 10
const DEFAULT_RETRY_ATTEMPTS = 2

function registerUnloadFlush(buffer: BatchBuffer): () => void {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof document.addEventListener !== 'function'
  ) {
    return () => undefined
  }

  const flushOnUnload = () => {
    void buffer.flushAll({ unload: true })
  }

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      flushOnUnload()
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pagehide', flushOnUnload)

  return () => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('pagehide', flushOnUnload)
  }
}

export function conversionCollectorPlugin(
  settings: ConversionCollectorSettings
): Plugin {
  const buffer = new BatchBuffer({
    endpoint: settings.endpoint,
    headers: settings.headers,
    retryAttempts: settings.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS,
    flushIntervalMs: settings.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS,
    batchSize: settings.batchSize ?? DEFAULT_BATCH_SIZE,
  })

  let analytics: Analytics | undefined
  let removeUnloadListeners: (() => void) | undefined

  async function deliver(
    ctx: Context,
    flushImmediately: boolean
  ): Promise<Context> {
    if (!analytics) {
      return ctx
    }

    const envelope = contextToEnvelope(ctx, analytics)
    if (!envelope) {
      return ctx
    }

    buffer.enqueue(envelope)

    if (flushImmediately) {
      try {
        await buffer.flush()
      } catch (error) {
        const reason = error instanceof Error ? error : new Error(String(error))
        ctx.log('error', 'Conversion collector delivery failed', { reason })
        ctx.setFailedDelivery({ reason })
        analytics.emit('error', {
          code: 'delivery_failure',
          reason: error,
          ctx,
        })
      }
    }

    return ctx
  }

  return {
    name: 'Conversion Collector',
    type: 'destination',
    version: '0.1.0',
    isLoaded: (): boolean => true,
    load: (_ctx, instance) => {
      analytics = instance as Analytics
      registerConversionCollectorBuffer(analytics, buffer)
      removeUnloadListeners = registerUnloadFlush(buffer)
      buffer.start()
      return Promise.resolve()
    },
    unload: () => {
      removeUnloadListeners?.()
      removeUnloadListeners = undefined
      return buffer.flushAll({ unload: true }).then(() => undefined)
    },
    track: (ctx) => deliver(ctx, false),
    page: (ctx) => deliver(ctx, false),
    screen: (ctx) => deliver(ctx, false),
    identify: (ctx) => deliver(ctx, true),
    alias: (ctx) => Promise.resolve(ctx),
    group: (ctx) => Promise.resolve(ctx),
  }
}
