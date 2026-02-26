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
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
  const output: CLIOutput = { success: false, sentBatches: 0 }

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
      flushInterval: config.flushInterval ?? 10000,
      maxRetries: config.maxRetries ?? 3,
      httpRequestTimeout: config.timeout ?? 10000,
    })

    const deliveryErrors: string[] = []
    analytics.on('error', (err) => {
      const reason = err.reason
      const msg =
        reason instanceof Error ? reason.message : String(reason ?? err.code)
      deliveryErrors.push(msg)
    })

    // Process event sequences
    for (const seq of sequences) {
      if (seq.delayMs > 0) {
        await sleep(seq.delayMs)
      }

      for (const event of seq.events) {
        sendEvent(analytics, event)
      }
    }

    // Flush and close
    await analytics.closeAndFlush()

    if (deliveryErrors.length > 0) {
      output.success = false
      output.error = deliveryErrors[0]
    } else {
      output.success = true
      output.sentBatches = 1
    }
  } catch (err) {
    output.error = err instanceof Error ? err.message : String(err)
  }

  console.log(JSON.stringify(output))
  process.exit(output.success ? 0 : 1)
}

void main()
