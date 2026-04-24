#!/usr/bin/env node
/**
 * Analytics Node E2E CLI
 *
 * Accepts a JSON input with event sequences and SDK configuration,
 * sends events through the analytics SDK, and outputs results as JSON.
 */

import { Analytics } from '@segment/analytics-node'

interface AnalyticsEvent {
  type: 'identify' | 'track' | 'page' | 'screen' | 'alias' | 'group'
  userId?: string
  anonymousId?: string
  messageId?: string
  timestamp?: string
  traits?: Record<string, unknown>
  event?: string
  properties?: Record<string, unknown>
  name?: string
  category?: string
  previousId?: string
  groupId?: string
  context?: Record<string, unknown>
  integrations?: Record<string, boolean | Record<string, unknown>>
}

interface EventSequence {
  delayMs: number
  events: AnalyticsEvent[]
}

interface CLIInput {
  writeKey: string
  apiHost: string
  sequences: EventSequence[]
  config?: {
    flushAt?: number
    flushInterval?: number
    maxRetries?: number
    timeout?: number
  }
}

interface CLIOutput {
  success: boolean
  error?: string
  sentBatches: number
  eventResults: EventResult[]
  httpLog: HttpLogEntry[]
}

interface EventResult {
  event: string
  type: string
  delivered: boolean
  failureReason?: string
}

interface HttpLogEntry {
  timestamp: string
  status: number
  url: string
  retryCount?: number
  bodyPreview: string
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function elapsed(start: number): string {
  return `${((Date.now() - start) / 1000).toFixed(1)}s`
}

function sendEvent(analytics: Analytics, event: AnalyticsEvent): void {
  // SDK requires either userId or anonymousId
  const identity = event.userId
    ? { userId: event.userId, anonymousId: event.anonymousId }
    : { anonymousId: event.anonymousId || 'anonymous' }

  const common = {
    ...identity,
    messageId: event.messageId,
    timestamp: event.timestamp ? new Date(event.timestamp) : undefined,
    context: event.context,
    integrations: event.integrations,
  }

  switch (event.type) {
    case 'identify':
      analytics.identify({
        ...common,
        traits: event.traits,
      })
      break
    case 'track':
      analytics.track({
        ...common,
        event: event.event!,
        properties: event.properties,
      })
      break
    case 'page':
      analytics.page({
        ...common,
        name: event.name,
        category: event.category,
        properties: event.properties,
      })
      break
    case 'screen':
      analytics.screen({
        ...common,
        name: event.name,
        category: event.category,
        properties: event.properties,
      })
      break
    case 'alias':
      analytics.alias({
        userId: event.userId!,
        previousId: event.previousId!,
        timestamp: common.timestamp,
        context: common.context,
      })
      break
    case 'group':
      analytics.group({
        ...common,
        groupId: event.groupId!,
        traits: event.traits,
      })
      break
    default:
      throw new Error(`Unknown event type: ${(event as AnalyticsEvent).type}`)
  }
}

async function main(): Promise<void> {
  const startTime = Date.now()
  const output: CLIOutput = {
    success: false,
    sentBatches: 0,
    eventResults: [],
    httpLog: [],
  }

  try {
    // Parse --input argument
    const inputIndex = process.argv.indexOf('--input')
    if (inputIndex === -1 || !process.argv[inputIndex + 1]) {
      throw new Error('Missing required --input argument')
    }

    const inputJson = process.argv[inputIndex + 1]
    const input: CLIInput = JSON.parse(inputJson)

    const { writeKey, apiHost, sequences, config = {} } = input

    // Create analytics client
    const analytics = new Analytics({
      writeKey,
      host: apiHost,
      flushAt: config.flushAt ?? 15,
      flushInterval: config.flushInterval ?? 1000,
      maxRetries: config.maxRetries ?? 3,
      httpRequestTimeout: config.timeout ?? 10000,
    })

    const deliveryErrors: string[] = []
    analytics.on('error', (err) => {
      const reason = err.reason
      const msg =
        reason instanceof Error ? reason.message : String(reason ?? err.code)
      deliveryErrors.push(msg)
      process.stderr.write(`[${elapsed(startTime)}] ERROR: ${msg}\n`)
    })

    analytics.on('http_request', (req) => {
      const body =
        typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const events = body.batch?.map((e: any) => e.event ?? e.type) ?? []
      const retryHeader = req.headers?.['X-Retry-Count']
      process.stderr.write(
        `[${elapsed(startTime)}] >> ${req.method} events=[${events.join(',')}]${
          retryHeader ? ` retry=${retryHeader}` : ''
        }\n`
      )
    })

    analytics.on('http_response', (res) => {
      const body =
        typeof res.body === 'string' ? JSON.parse(res.body) : res.body
      const events = body.batch?.map((e: any) => e.event ?? e.type) ?? []
      const retryAfter = res.headers?.['retry-after']
      process.stderr.write(
        `[${elapsed(startTime)}] << ${res.status} events=[${events.join(',')}]${
          retryAfter ? ` retry-after=${retryAfter}` : ''
        }\n`
      )
    })

    // Process event sequences
    let totalEvents = 0
    for (const seq of sequences) {
      if (seq.delayMs > 0) {
        process.stderr.write(
          `[${elapsed(startTime)}] sleeping ${seq.delayMs}ms...\n`
        )
        await sleep(seq.delayMs)
      }

      for (const event of seq.events) {
        totalEvents++
        const label = event.event ?? event.type
        process.stderr.write(
          `[${elapsed(startTime)}] enqueue #${totalEvents}: ${label}\n`
        )
        sendEvent(analytics, event)
      }
    }

    process.stderr.write(
      `[${elapsed(
        startTime
      )}] all ${totalEvents} events enqueued, calling closeAndFlush...\n`
    )

    // Flush and close
    const timeoutMs = (config.timeout ?? 75) * 1000
    await analytics.closeAndFlush({ timeout: timeoutMs })

    process.stderr.write(
      `[${elapsed(startTime)}] closeAndFlush resolved. errors=${
        deliveryErrors.length
      }\n`
    )

    if (deliveryErrors.length > 0) {
      output.success = false
      output.error = deliveryErrors[0]
    } else {
      output.success = true
      output.sentBatches = output.httpLog.length
    }
  } catch (err) {
    output.error = err instanceof Error ? err.message : String(err)
    process.stderr.write(`[${elapsed(startTime)}] FATAL: ${output.error}\n`)
  }

  console.log(JSON.stringify(output, null, 2))
  process.exit(output.success ? 0 : 1)
}

void main()
