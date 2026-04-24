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
  messageId?: string
  timestamp?: string
  event?: string
  name?: string
  category?: string
  properties?: Record<string, unknown>
  traits?: Record<string, unknown>
  groupId?: string
  previousId?: string
  context?: Record<string, unknown>
  integrations?: Record<string, boolean | Record<string, unknown>>
}

interface EventSequence {
  delayMs: number
  events: AnalyticsEvent[]
}

interface CLIInput {
  writeKey: string
  apiHost?: string
  cdnHost?: string
  sequences: EventSequence[]
  config?: CLIConfig
}

// --- Fetch Monitor ---
// The browser SDK's Segment.io plugin handles retries internally and swallows
// all errors (never fires delivery_failure events). We monitor fetch calls to
// detect when delivery activity has settled and to observe final HTTP statuses.

let lastApiResponseTime = 0
let inflightApiRequests = 0
let lastApiStatus = 0
let firstApiErrorStatus = 0
let lastRetryAfterSeen = 0
let apiHostPattern = ''

function installFetchMonitor(apiHost: string): void {
  apiHostPattern = apiHost.replace(/^https?:\/\//, '')
  const nativeFetch = globalThis.fetch

  ;(globalThis as any).fetch = async function monitoredFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.href
        : (input as Request).url

    // Only monitor API requests, not CDN settings/project requests
    const isApi =
      apiHostPattern &&
      url.includes(apiHostPattern) &&
      !url.includes('/settings') &&
      !url.includes('/projects')

    if (!isApi) {
      return nativeFetch.call(globalThis, input, init)
    }

    inflightApiRequests++
    try {
      const response = await nativeFetch.call(globalThis, input, init)
      lastApiStatus = response.status
      lastApiResponseTime = Date.now()
      if (response.status >= 400 && firstApiErrorStatus === 0) {
        firstApiErrorStatus = response.status
      }
      if (response.status === 429) {
        const ra = response.headers.get('Retry-After')
        if (ra) {
          lastRetryAfterSeen = Math.max(
            lastRetryAfterSeen,
            parseInt(ra, 10) || 60
          )
        } else {
          lastRetryAfterSeen = Math.max(lastRetryAfterSeen, 60)
        }
      }
      return response
    } catch (err) {
      lastApiResponseTime = Date.now()
      throw err
    } finally {
      inflightApiRequests--
    }
  }
}

/**
 * Wait for all API delivery activity to settle.
 *
 * The browser SDK's scheduleFlush uses a small random delay (100-600ms)
 * between retry cycles, plus exponential backoff from pushWithBackoff.
 * We wait until no API activity for a settling period.
 */
async function waitForDelivery(maxWaitMs = 60000): Promise<void> {
  const start = Date.now()

  // Wait for at least one API request
  while (lastApiResponseTime === 0 && Date.now() - start < maxWaitMs) {
    await sleep(100)
  }

  // Wait until no in-flight requests and enough quiet time
  while (Date.now() - start < maxWaitMs) {
    if (inflightApiRequests > 0) {
      await sleep(100)
      continue
    }

    const elapsed = Date.now() - lastApiResponseTime
    // After success: brief settle for any remaining event dispatches.
    // If we've ever seen a 429 with Retry-After, use that + buffer as settle
    // time, since a 200 after a 429 doesn't mean all retries are done.
    // Without any 429s, a short settle is fine.
    const settleMs =
      lastRetryAfterSeen > 0
        ? (lastRetryAfterSeen + 5) * 1000
        : lastApiStatus < 400
        ? 1500
        : 20000

    if (elapsed >= settleMs) {
      return
    }
    await sleep(200)
  }
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

function sleep(ms: number): Promise<void> {
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

    // Install fetch monitor BEFORE importing the SDK
    if (input.apiHost) {
      installFetchMonitor(input.apiHost)
    }

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
    const { AnalyticsBrowser } = await import('@segment/analytics-next')

    // Check if batching mode is enabled via environment variable
    const useBatching = process.env.BROWSER_BATCHING === 'true'

    // Build Segment.io integration config
    const segmentConfig: Record<string, unknown> = {}

    if (input.apiHost) {
      const protocol = input.apiHost.startsWith('https') ? 'https' : 'http'
      segmentConfig.protocol = protocol

      const apiHostStripped = input.apiHost.replace(/^https?:\/\//, '')
      segmentConfig.apiHost = apiHostStripped + '/v1'
    }

    // Wire maxRetries and backoff timing through httpConfig — this controls
    // both the plugin's PriorityQueue (fetch-dispatcher path) and the
    // batched-dispatcher's internal retry loop.
    {
      const backoffConfig: Record<string, unknown> = {
        // Use a short base interval so batched-dispatcher backoff aligns with
        // fetch-dispatcher's core backoff (100ms base). The default 500ms base
        // produces gaps that exceed the CLI's settle-time detection.
        baseBackoffInterval: 0.1,
      }
      if (input.config?.maxRetries != null) {
        backoffConfig.maxRetryCount = input.config.maxRetries
      }
      segmentConfig.httpConfig = { backoffConfig }
    }

    if (useBatching) {
      segmentConfig.deliveryStrategy = {
        strategy: 'batching',
        config: {
          size: input.config?.flushAt ?? 1,
          timeout: 1000,
        },
      }
    }

    // Initialize analytics
    const [analytics] = await AnalyticsBrowser.load(
      {
        writeKey: input.writeKey,
        ...(input.cdnHost && { cdnURL: input.cdnHost }),
      },
      {
        integrations: {
          'Segment.io': segmentConfig,
        },
        disableClientPersistence: true,
      }
    )

    // Listen for delivery errors (now emitted by the Segment.io plugin)
    const deliveryErrors: string[] = []
    analytics.on('error', (err) => {
      const reason = (err as any).reason
      const msg =
        reason instanceof Error
          ? reason.message
          : String(reason ?? (err as any).code)
      deliveryErrors.push(msg)
    })

    // Process event sequences
    for (const seq of input.sequences) {
      if (seq.delayMs > 0) {
        await sleep(seq.delayMs)
      }

      for (const event of seq.events) {
        await sendEvent(analytics, event)
      }
    }

    // Wait for all delivery activity to settle
    const maxWaitMs = (input.config?.timeout ?? 60) * 1000
    await waitForDelivery(maxWaitMs)

    // Determine success/failure from delivery errors (emitted by the
    // Segment.io plugin) and observed fetch responses as fallback.
    if (deliveryErrors.length > 0) {
      output = { success: false, error: deliveryErrors[0], sentBatches: 0 }
    } else if (lastApiStatus >= 400) {
      // Fetch monitor fallback: last response was an error
      output = {
        success: false,
        error: `HTTP ${firstApiErrorStatus || lastApiStatus}`,
        sentBatches: 0,
      }
    } else {
      output = { success: true, sentBatches: 1 }
    }

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
