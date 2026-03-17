import { Facade } from '@segment/facade'
import { Analytics } from '../../core/analytics'
import { CDNSettings } from '../../browser'
import { isOffline } from '../../core/connection'
import { Context } from '../../core/context'
import { Plugin } from '../../core/plugin'
import { PriorityQueue } from '../../lib/priority-queue'
import { PersistedPriorityQueue } from '../../lib/priority-queue/persisted'
import { toFacade } from '../../lib/to-facade'
import batch from './batched-dispatcher'
import standard from './fetch-dispatcher'
import { normalize } from './normalize'
import { scheduleFlush } from './schedule-flush'
import { SEGMENT_API_HOST } from '../../core/constants'
import {
  DeliveryStrategy,
  HttpConfig,
  resolveHttpConfig,
} from './shared-dispatcher'

export type SegmentioSettings = {
  apiKey: string
  apiHost?: string
  protocol?: 'http' | 'https'

  addBundledMetadata?: boolean
  unbundledIntegrations?: string[]
  bundledConfigIds?: string[]
  unbundledConfigIds?: string[]

  maybeBundledConfigIds?: Record<string, string[]>

  deliveryStrategy?: DeliveryStrategy

  httpConfig?: HttpConfig
}

type JSON = ReturnType<Facade['json']>

function onAlias(analytics: Analytics, json: JSON): JSON {
  const user = analytics.user()
  json.previousId =
    json.previousId ?? json.from ?? user.id() ?? user.anonymousId()
  json.userId = json.userId ?? json.to
  delete json.from
  delete json.to
  return json
}

export type SegmentIOPluginMetadata = {
  writeKey: string
  apiHost: string
  protocol: string
}
export interface SegmentIOPlugin extends Plugin {
  metadata: SegmentIOPluginMetadata
}

export const isSegmentPlugin = (plugin: Plugin): plugin is SegmentIOPlugin => {
  return plugin.name === 'Segment.io'
}

export function segmentio(
  analytics: Analytics,
  settings?: SegmentioSettings,
  integrations?: CDNSettings['integrations']
): Plugin {
  // Attach `pagehide` before buffer is created so that inflight events are added
  // to the buffer before the buffer persists events in its own `pagehide` handler.
  window.addEventListener('pagehide', () => {
    buffer.push(...Array.from(inflightEvents))
    inflightEvents.clear()
  })

  const writeKey = settings?.apiKey ?? ''

  const buffer = analytics.options.disableClientPersistence
    ? new PriorityQueue<Context>(analytics.queue.queue.maxAttempts, [])
    : new PersistedPriorityQueue(
        analytics.queue.queue.maxAttempts,
        `${writeKey}:dest-Segment.io`
      )

  const inflightEvents = new Set<Context>()
  const flushing = false

  const apiHost = settings?.apiHost ?? SEGMENT_API_HOST
  const protocol = settings?.protocol ?? 'https'
  const remote = `${protocol}://${apiHost}`

  const resolvedHttpConfig = resolveHttpConfig(settings?.httpConfig)

  // Wire the CDN/user-configured maxRetryCount to the plugin's internal buffer.
  // For fetch-dispatcher (standard mode), this is the only retry control —
  // retries are managed by the plugin's PriorityQueue, not the dispatcher.
  // For batched-dispatcher, retries are handled internally by the dispatcher
  // (which also reads maxRetryCount), so this mainly serves as a safety net.
  // Only override when explicitly set; otherwise respect the PriorityQueue's
  // maxAttempts from createDefaultQueue (which honors the retryQueue setting).
  if (settings?.httpConfig?.backoffConfig?.maxRetryCount != null) {
    buffer.maxAttempts = resolvedHttpConfig.backoffConfig.maxRetryCount
  }

  const deliveryStrategy = settings?.deliveryStrategy
  const client =
    deliveryStrategy &&
    'strategy' in deliveryStrategy &&
    deliveryStrategy.strategy === 'batching'
      ? batch(apiHost, deliveryStrategy.config, resolvedHttpConfig, protocol)
      : standard(deliveryStrategy?.config, resolvedHttpConfig)

  async function send(ctx: Context): Promise<Context> {
    if (isOffline()) {
      buffer.push(ctx)
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      scheduleFlush(flushing, buffer, segmentio, scheduleFlush)
      return ctx
    }

    inflightEvents.add(ctx)

    const path = ctx.event.type.charAt(0)

    let json = toFacade(ctx.event).json()

    if (ctx.event.type === 'track') {
      delete json.traits
    }

    if (ctx.event.type === 'alias') {
      json = onAlias(analytics, json)
    }

    const attempts = buffer.getAttempts(ctx)

    if (attempts >= buffer.maxAttempts) {
      inflightEvents.delete(ctx)
      const error = new Error(
        `Retry attempts exhausted (${attempts}/${buffer.maxAttempts})`
      )
      ctx.setFailedDelivery({ reason: error })
      analytics.emit('error', {
        code: 'delivery_failure',
        reason: error,
        ctx,
      })
      return ctx
    }

    return client
      .dispatch(
        `${remote}/${path}`,
        normalize(analytics, json, settings, integrations, ctx),
        attempts
      )
      .then(() => ctx)
      .catch((error) => {
        ctx.log('error', 'Error sending event', error)
        if (error.name === 'RateLimitError') {
          const timeout = error.retryTimeout
          buffer.pushWithBackoff(ctx, timeout)
        } else if (error.name === 'NonRetryableError') {
          // Do not requeue non-retryable HTTP failures; drop the event.
          ctx.setFailedDelivery({ reason: error })
          analytics.emit('error', {
            code: 'delivery_failure',
            reason: error,
            ctx,
          })
        } else {
          buffer.pushWithBackoff(ctx)
        }
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        scheduleFlush(flushing, buffer, segmentio, scheduleFlush)
        return ctx
      })
      .finally(() => {
        inflightEvents.delete(ctx)
      })
  }

  const segmentio: SegmentIOPlugin = {
    metadata: {
      writeKey,
      apiHost,
      protocol,
    },
    name: 'Segment.io',
    type: 'destination',
    version: '0.1.0',
    isLoaded: (): boolean => true,
    load: (): Promise<void> => Promise.resolve(),
    track: send,
    identify: send,
    page: send,
    alias: send,
    group: send,
    screen: send,
  }

  // Buffer may already have items if they were previously stored in localStorage.
  // Start flushing them immediately.
  if (buffer.todo) {
    scheduleFlush(flushing, buffer, segmentio, scheduleFlush)
  }

  return segmentio
}
