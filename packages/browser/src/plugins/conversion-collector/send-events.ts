import type {
  AnalyticsEventEnvelope,
  ConversionCollectorSettings,
} from './types'

export type CollectSendConfig = Pick<
  ConversionCollectorSettings,
  'endpoint' | 'headers' | 'retryAttempts'
>

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function sendEventsToCollect(
  events: AnalyticsEventEnvelope[],
  config: CollectSendConfig
): Promise<void> {
  const sentAt = new Date().toISOString()
  const body = JSON.stringify({
    events: events.map((event) => ({
      ...event,
      sent_at: sentAt,
    })),
  })

  const retryAttempts = config.retryAttempts ?? 2
  let attempt = 0
  let lastError: unknown

  while (attempt <= retryAttempts) {
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body,
      })

      if (!response.ok) {
        throw new Error(`Collect failed with status ${response.status}`)
      }

      return
    } catch (error) {
      lastError = error
      const shouldRetry = attempt < retryAttempts
      if (!shouldRetry) {
        break
      }
      const backoffMs = Math.min(1500, 200 * 2 ** attempt)
      await wait(backoffMs)
    } finally {
      attempt += 1
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Collect request failed')
}
