#!/usr/bin/env node
/**
 * E2E CLI for analytics-browser using jsdom
 *
 * Runs the browser SDK in a jsdom environment to test against a mock server.
 */

import { JSDOM } from 'jsdom'

// --- Types ---

interface CLIOutput {
  success: boolean
  error?: string
  sentBatches: number
}

interface CLIConfig {
  flushAt?: number
  flushInterval?: number
  maxRetries?: number
  timeout?: number
}

interface AnalyticsEvent {
  type: string
  userId?: string
  anonymousId?: string
  event?: string
  name?: string
  properties?: Record<string, unknown>
  traits?: Record<string, unknown>
  groupId?: string
  previousId?: string
}

interface EventSequence {
  delayMs: number
  events: AnalyticsEvent[]
}

interface CLIInput {
  writeKey: string
  apiHost: string
  sequences: EventSequence[]
  config?: CLIConfig
}

// --- Helpers ---

function parseArgs(): string | null {
  const args = process.argv.slice(2)
  const inputIndex = args.indexOf('--input')
  if (inputIndex === -1 || inputIndex + 1 >= args.length) {
    return null
  }
  return args[inputIndex + 1]
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// --- Main ---

async function main(): Promise<void> {
  let output: CLIOutput = { success: false, sentBatches: 0 }

  try {
    const inputJson = parseArgs()
    if (!inputJson) {
      throw new Error('Missing required --input argument')
    }

    const input: CLIInput = JSON.parse(inputJson)

    // Create jsdom environment with the browser SDK
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>E2E Test</title></head>
        <body></body>
      </html>
    `

    const dom = new JSDOM(html, {
      url: 'https://test.example.com',
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true,
    })

    const { window } = dom

    // Make window globals available for browser SDK
    // Use Node's native fetch instead of jsdom's (better HTTP support)
    ;(global as any).window = window
    ;(global as any).document = window.document
    ;(global as any).navigator = window.navigator
    ;(global as any).location = window.location
    ;(global as any).localStorage = window.localStorage
    ;(global as any).sessionStorage = window.sessionStorage
    // Keep Node's native fetch - it works better than jsdom's
    // (global as any).fetch is already available in Node 18+
    ;(global as any).Blob = window.Blob
    ;(global as any).XMLHttpRequest = window.XMLHttpRequest

    // Import the browser SDK after setting up globals
    // We need to dynamically import to ensure globals are set first
    const { AnalyticsBrowser } = await import('@segment/analytics-next')

    // Check if batching mode is enabled via environment variable
    const useBatching = process.env.BROWSER_BATCHING === 'true'
    const protocol = input.apiHost.startsWith('https') ? 'https' : 'http'

    // Build Segment.io integration config
    const segmentConfig: Record<string, unknown> = {
      protocol,
    }

    if (useBatching) {
      // Batching mode: pass full URL (with scheme) since we patched batched-dispatcher
      // to check for existing scheme
      segmentConfig.apiHost = input.apiHost
      segmentConfig.deliveryStrategy = {
        strategy: 'batching',
        config: {
          size: input.config?.flushAt ?? 1, // flush immediately for testing
          timeout: 1000,
        },
      }
    } else {
      // Standard mode: fetch-dispatcher uses the URL directly
      const apiHostStripped = input.apiHost.replace(/^https?:\/\//, '')
      segmentConfig.apiHost = apiHostStripped + '/v1'
    }

    // Initialize analytics with the provided config
    const [analytics] = await AnalyticsBrowser.load(
      {
        writeKey: input.writeKey,
        cdnURL: input.apiHost,
      },
      {
        integrations: {
          'Segment.io': segmentConfig,
        },
        disableClientPersistence: true,
      }
    )

    // Process event sequences
    for (const seq of input.sequences) {
      if (seq.delayMs > 0) {
        await delay(seq.delayMs)
      }

      for (const event of seq.events) {
        await sendEvent(analytics, event)
      }
    }

    // Wait for events to be sent (browser SDK auto-flushes)
    await delay(3000)

    output = { success: true, sentBatches: 1 }

    // Cleanup
    dom.window.close()
  } catch (err) {
    output = {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      sentBatches: 0,
    }
  }

  console.log(JSON.stringify(output))
  process.exit(output.success ? 0 : 1)
}

async function sendEvent(
  analytics: import('@segment/analytics-next').Analytics,
  event: AnalyticsEvent
): Promise<void> {
  switch (event.type) {
    case 'identify':
      await analytics.identify(event.userId, event.traits)
      break
    case 'track':
      await analytics.track(event.event || 'Unknown Event', event.properties)
      break
    case 'page':
      await analytics.page(undefined, event.name, event.properties)
      break
    case 'screen':
      // Browser SDK doesn't have screen, use page
      await analytics.page(undefined, event.name, event.properties)
      break
    case 'alias':
      await analytics.alias(event.userId || '')
      break
    case 'group':
      await analytics.group(event.groupId || '', event.traits)
      break
    default:
      throw new Error(`Unknown event type: ${event.type}`)
  }
}

void main()
