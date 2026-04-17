const fetchMock = jest.fn()

jest.mock('../../../lib/fetch', () => {
  return {
    fetch: (...args: any[]) => fetchMock(...args),
  }
})

import dispatcherFactory from '../fetch-dispatcher'
import { RateLimitError } from '../ratelimit-error'
import { resolveHttpConfig } from '../shared-dispatcher'
import { createError, createSuccess } from '../../../test-helpers/factories'

const defaultHttpConfig = resolveHttpConfig()

describe('fetch dispatcher', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('omits X-Retry-Count on first attempt and includes it on retries', async () => {
    ;(fetchMock as jest.Mock)
      .mockReturnValueOnce(createSuccess({}))
      .mockReturnValueOnce(createSuccess({}))

    const client = dispatcherFactory()

    await client.dispatch('http://example.com', { one: 1 })
    await client.dispatch('http://example.com', { two: 2 }, 1)

    expect(fetchMock).toHaveBeenCalledTimes(2)

    const firstHeaders = (fetchMock as jest.Mock).mock.calls[0][1]
      .headers as Record<string, string>
    const secondHeaders = (fetchMock as jest.Mock).mock.calls[1][1]
      .headers as Record<string, string>

    expect(firstHeaders['X-Retry-Count']).toBeUndefined()
    expect(secondHeaders['X-Retry-Count']).toBe('1')
  })

  it('treats <400 as success and does not throw', async () => {
    ;(fetchMock as jest.Mock).mockReturnValue(
      createSuccess({}, { status: 201 })
    )

    const client = dispatcherFactory()

    await expect(
      client.dispatch('http://example.com', { ok: true })
    ).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('throws retryable Error for 5xx except 501, 505, 511', async () => {
    ;(fetchMock as jest.Mock).mockReturnValue(createError({ status: 500 }))

    const client = dispatcherFactory(undefined, defaultHttpConfig)

    await expect(
      client.dispatch('http://example.com', { test: true })
    ).rejects.toThrow('Retryable error: 500')
  })

  it('throws NonRetryableError for 501, 505, 511 (via statusCodeOverrides)', async () => {
    const client = dispatcherFactory(undefined, defaultHttpConfig)

    for (const status of [501, 505, 511]) {
      ;(fetchMock as jest.Mock).mockReturnValue(createError({ status }))

      await expect(
        client.dispatch('http://example.com', { test: status })
      ).rejects.toMatchObject({ name: 'NonRetryableError' })
    }
  })

  it('throws retryable Error for retryable 4xx statuses', async () => {
    const client = dispatcherFactory(undefined, defaultHttpConfig)

    for (const status of [408, 410, 429, 460]) {
      ;(fetchMock as jest.Mock).mockReturnValue(createError({ status }))

      await expect(
        client.dispatch('http://example.com', { test: status })
      ).rejects.toThrow(/Retryable error/)
    }
  })

  it('throws NonRetryableError for non-retryable 4xx statuses', async () => {
    const client = dispatcherFactory(undefined, defaultHttpConfig)

    for (const status of [400, 401, 403, 404]) {
      ;(fetchMock as jest.Mock).mockReturnValue(createError({ status }))

      await expect(
        client.dispatch('http://example.com', { test: status })
      ).rejects.toMatchObject({ name: 'NonRetryableError' })
    }
  })

  it('emits RateLimitError for 429 with Retry-After header', async () => {
    const headers = new Headers()
    headers.set('Retry-After', '5')

    const client = dispatcherFactory()

    ;(fetchMock as jest.Mock).mockReturnValue(
      createError({ status: 429, headers })
    )

    await expect(
      client.dispatch('http://example.com', { status: 429 })
    ).rejects.toMatchObject<Partial<RateLimitError>>({
      name: 'RateLimitError',
      retryTimeout: 5000,
      isRetryableWithoutCount: true,
    })
  })

  it('408/503 with Retry-After header use backoff, not RateLimitError', async () => {
    const headers = new Headers()
    headers.set('Retry-After', '5')

    const client = dispatcherFactory(undefined, defaultHttpConfig)

    for (const status of [408, 503]) {
      ;(fetchMock as jest.Mock).mockReturnValue(
        createError({ status, headers })
      )

      await expect(
        client.dispatch('http://example.com', { status })
      ).rejects.toThrow(/Retryable error/)
    }
  })

  it('falls back to normal retryable path when Retry-After is missing or invalid', async () => {
    const client = dispatcherFactory(undefined, defaultHttpConfig)

    // Missing Retry-After header — 429 is in statusCodeOverrides as 'retry'
    ;(fetchMock as jest.Mock).mockReturnValueOnce(createError({ status: 429 }))

    await expect(
      client.dispatch('http://example.com', { bad: 'no-header' })
    ).rejects.toThrow(/Retryable error: 429/)

    // Invalid Retry-After header
    const badHeaders = new Headers()
    badHeaders.set('Retry-After', 'not-a-number')
    ;(fetchMock as jest.Mock).mockReturnValueOnce(
      createError({ status: 429, headers: badHeaders })
    )

    await expect(
      client.dispatch('http://example.com', { bad: 'invalid-header' })
    ).rejects.toThrow(/Retryable error: 429/)
  })

  it('throws NonRetryableError for 413 (Payload Too Large)', async () => {
    const client = dispatcherFactory()
    ;(fetchMock as jest.Mock).mockReturnValue(createError({ status: 413 }))

    await expect(
      client.dispatch('http://example.com', { test: 413 })
    ).rejects.toMatchObject({ name: 'NonRetryableError' })
  })

  it('sends Authorization header with Basic auth', async () => {
    ;(fetchMock as jest.Mock).mockReturnValue(createSuccess({}))

    const client = dispatcherFactory()
    await client.dispatch('http://example.com', {
      writeKey: 'test-write-key',
      event: 'test',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const headers = (fetchMock as jest.Mock).mock.calls[0][1].headers as Record<
      string,
      string
    >
    expect(headers['Authorization']).toBe(`Basic ${btoa('test-write-key:')}`)
  })

  it('caps Retry-After at 300 seconds', async () => {
    const headers = new Headers()
    headers.set('Retry-After', '500') // Should be capped at 300

    const client = dispatcherFactory()
    ;(fetchMock as jest.Mock).mockReturnValue(
      createError({ status: 429, headers })
    )

    await expect(
      client.dispatch('http://example.com', { test: true })
    ).rejects.toMatchObject<Partial<RateLimitError>>({
      name: 'RateLimitError',
      retryTimeout: 300000, // 300 seconds = 300000 ms, not 500000
      isRetryableWithoutCount: true,
    })
  })

  describe('CDN httpConfig: statusCodeOverrides precedence', () => {
    it('drops 429 with Retry-After when statusCodeOverrides says drop', async () => {
      const headers = new Headers()
      headers.set('Retry-After', '5')

      const httpConfig = resolveHttpConfig({
        backoffConfig: {
          statusCodeOverrides: { '429': 'drop' },
        },
      })
      const client = dispatcherFactory(undefined, httpConfig)
      ;(fetchMock as jest.Mock).mockReturnValue(
        createError({ status: 429, headers })
      )

      await expect(
        client.dispatch('http://example.com', { test: true })
      ).rejects.toMatchObject({ name: 'NonRetryableError' })
    })

    it('drops 503 when statusCodeOverrides overrides default 5xx retry', async () => {
      const httpConfig = resolveHttpConfig({
        backoffConfig: {
          statusCodeOverrides: { '503': 'drop' },
        },
      })
      const client = dispatcherFactory(undefined, httpConfig)
      ;(fetchMock as jest.Mock).mockReturnValue(createError({ status: 503 }))

      await expect(
        client.dispatch('http://example.com', { test: true })
      ).rejects.toMatchObject({ name: 'NonRetryableError' })
    })
  })

  describe('CDN httpConfig: maxRetryInterval', () => {
    it('caps Retry-After to custom maxRetryInterval from CDN', async () => {
      const headers = new Headers()
      headers.set('Retry-After', '10')

      const httpConfig = resolveHttpConfig({
        rateLimitConfig: { maxRetryInterval: 5 },
      })
      const client = dispatcherFactory(undefined, httpConfig)
      ;(fetchMock as jest.Mock).mockReturnValue(
        createError({ status: 429, headers })
      )

      await expect(
        client.dispatch('http://example.com', { test: true })
      ).rejects.toMatchObject<Partial<RateLimitError>>({
        name: 'RateLimitError',
        retryTimeout: 5000, // Capped to 5s, not 10s
        isRetryableWithoutCount: true,
      })
    })
  })
})
