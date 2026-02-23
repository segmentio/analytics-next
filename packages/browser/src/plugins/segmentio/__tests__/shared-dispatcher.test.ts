import {
  resolveHttpConfig,
  getStatusBehavior,
  parseRetryAfter,
  computeBackoff,
  HttpConfig,
  ResolvedBackoffConfig,
  ResolvedRateLimitConfig,
} from '../shared-dispatcher'

describe('resolveHttpConfig', () => {
  it('applies all defaults when called with undefined', () => {
    const resolved = resolveHttpConfig(undefined)

    expect(resolved.rateLimitConfig).toEqual({
      enabled: true,
      maxRetryCount: 100,
      maxRetryInterval: 300,
      maxRateLimitDuration: 180,
    })

    expect(resolved.backoffConfig).toEqual({
      enabled: true,
      maxRetryCount: 100,
      baseBackoffInterval: 0.5,
      maxBackoffInterval: 300,
      maxTotalBackoffDuration: 43200,
      jitterPercent: 10,
      default4xxBehavior: 'drop',
      default5xxBehavior: 'retry',
      statusCodeOverrides: {
        '408': 'retry',
        '410': 'retry',
        '429': 'retry',
        '460': 'retry',
        '501': 'drop',
        '505': 'drop',
        '511': 'drop',
      },
    })
  })

  it('applies all defaults when called with empty object', () => {
    const resolved = resolveHttpConfig({})

    expect(resolved.rateLimitConfig.enabled).toBe(true)
    expect(resolved.rateLimitConfig.maxRetryCount).toBe(100)
    expect(resolved.backoffConfig.enabled).toBe(true)
    expect(resolved.backoffConfig.maxRetryCount).toBe(100)
    expect(resolved.backoffConfig.baseBackoffInterval).toBe(0.5)
  })

  it('passes through explicitly provided values', () => {
    const config: HttpConfig = {
      rateLimitConfig: {
        enabled: false,
        maxRetryCount: 50,
        maxRetryInterval: 120,
        maxRateLimitDuration: 3600,
      },
      backoffConfig: {
        enabled: false,
        maxRetryCount: 25,
        baseBackoffInterval: 1,
        maxBackoffInterval: 60,
        maxTotalBackoffDuration: 7200,
        jitterPercent: 20,
        default4xxBehavior: 'retry',
        default5xxBehavior: 'drop',
        statusCodeOverrides: {
          '500': 'drop',
        },
      },
    }

    const resolved = resolveHttpConfig(config)

    expect(resolved.rateLimitConfig).toEqual({
      enabled: false,
      maxRetryCount: 50,
      maxRetryInterval: 120,
      maxRateLimitDuration: 3600,
    })

    expect(resolved.backoffConfig.enabled).toBe(false)
    expect(resolved.backoffConfig.maxRetryCount).toBe(25)
    expect(resolved.backoffConfig.baseBackoffInterval).toBe(1)
    expect(resolved.backoffConfig.maxBackoffInterval).toBe(60)
    expect(resolved.backoffConfig.maxTotalBackoffDuration).toBe(7200)
    expect(resolved.backoffConfig.jitterPercent).toBe(20)
    expect(resolved.backoffConfig.default4xxBehavior).toBe('retry')
    expect(resolved.backoffConfig.default5xxBehavior).toBe('drop')
  })

  it('defaults missing fields in partial config', () => {
    const config: HttpConfig = {
      rateLimitConfig: {
        maxRetryCount: 50,
      },
      backoffConfig: {
        jitterPercent: 5,
      },
    }

    const resolved = resolveHttpConfig(config)

    // Provided values
    expect(resolved.rateLimitConfig.maxRetryCount).toBe(50)
    expect(resolved.backoffConfig.jitterPercent).toBe(5)

    // Defaults for missing fields
    expect(resolved.rateLimitConfig.enabled).toBe(true)
    expect(resolved.rateLimitConfig.maxRetryInterval).toBe(300)
    expect(resolved.rateLimitConfig.maxRateLimitDuration).toBe(180)
    expect(resolved.backoffConfig.enabled).toBe(true)
    expect(resolved.backoffConfig.maxRetryCount).toBe(100)
    expect(resolved.backoffConfig.baseBackoffInterval).toBe(0.5)
    expect(resolved.backoffConfig.maxBackoffInterval).toBe(300)
  })

  describe('value clamping', () => {
    it('clamps maxRetryInterval to safe range', () => {
      const tooHigh = resolveHttpConfig({
        rateLimitConfig: { maxRetryInterval: 999999 },
      })
      expect(tooHigh.rateLimitConfig.maxRetryInterval).toBe(86400)

      const tooLow = resolveHttpConfig({
        rateLimitConfig: { maxRetryInterval: 0 },
      })
      expect(tooLow.rateLimitConfig.maxRetryInterval).toBe(0.1)
    })

    it('clamps maxRateLimitDuration to safe range', () => {
      const tooHigh = resolveHttpConfig({
        rateLimitConfig: { maxRateLimitDuration: 9999999 },
      })
      expect(tooHigh.rateLimitConfig.maxRateLimitDuration).toBe(86400)

      const tooLow = resolveHttpConfig({
        rateLimitConfig: { maxRateLimitDuration: 1 },
      })
      expect(tooLow.rateLimitConfig.maxRateLimitDuration).toBe(10)
    })

    it('clamps baseBackoffInterval to safe range', () => {
      const tooHigh = resolveHttpConfig({
        backoffConfig: { baseBackoffInterval: 999 },
      })
      expect(tooHigh.backoffConfig.baseBackoffInterval).toBe(300)

      const tooLow = resolveHttpConfig({
        backoffConfig: { baseBackoffInterval: 0.01 },
      })
      expect(tooLow.backoffConfig.baseBackoffInterval).toBe(0.1)
    })

    it('clamps maxBackoffInterval to safe range', () => {
      const tooHigh = resolveHttpConfig({
        backoffConfig: { maxBackoffInterval: 100000 },
      })
      expect(tooHigh.backoffConfig.maxBackoffInterval).toBe(86400)
    })

    it('clamps jitterPercent to 0-100', () => {
      const tooHigh = resolveHttpConfig({
        backoffConfig: { jitterPercent: 150 },
      })
      expect(tooHigh.backoffConfig.jitterPercent).toBe(100)

      const tooLow = resolveHttpConfig({
        backoffConfig: { jitterPercent: -10 },
      })
      expect(tooLow.backoffConfig.jitterPercent).toBe(0)
    })
  })

  describe('statusCodeOverrides', () => {
    it('merges user overrides with defaults', () => {
      const resolved = resolveHttpConfig({
        backoffConfig: {
          statusCodeOverrides: {
            '500': 'drop',
            '418': 'retry',
          },
        },
      })

      // User overrides
      expect(resolved.backoffConfig.statusCodeOverrides['500']).toBe('drop')
      expect(resolved.backoffConfig.statusCodeOverrides['418']).toBe('retry')

      // Defaults still present
      expect(resolved.backoffConfig.statusCodeOverrides['408']).toBe('retry')
      expect(resolved.backoffConfig.statusCodeOverrides['501']).toBe('drop')
      expect(resolved.backoffConfig.statusCodeOverrides['505']).toBe('drop')
    })

    it('allows user overrides to replace defaults', () => {
      const resolved = resolveHttpConfig({
        backoffConfig: {
          statusCodeOverrides: {
            '501': 'retry', // Override the default "drop"
          },
        },
      })

      expect(resolved.backoffConfig.statusCodeOverrides['501']).toBe('retry')
    })

    it('uses only defaults when no overrides provided', () => {
      const resolved = resolveHttpConfig({})

      expect(resolved.backoffConfig.statusCodeOverrides).toEqual({
        '408': 'retry',
        '410': 'retry',
        '429': 'retry',
        '460': 'retry',
        '501': 'drop',
        '505': 'drop',
        '511': 'drop',
      })
    })
  })
})

describe('getStatusBehavior', () => {
  const defaults = resolveHttpConfig().backoffConfig

  it('returns override from statusCodeOverrides when present', () => {
    expect(getStatusBehavior(408, defaults)).toBe('retry')
    expect(getStatusBehavior(501, defaults)).toBe('drop')
    expect(getStatusBehavior(505, defaults)).toBe('drop')
    expect(getStatusBehavior(429, defaults)).toBe('retry')
    expect(getStatusBehavior(460, defaults)).toBe('retry')
  })

  it('falls back to default5xxBehavior for 5xx without override', () => {
    expect(getStatusBehavior(500, defaults)).toBe('retry')
    expect(getStatusBehavior(502, defaults)).toBe('retry')
    expect(getStatusBehavior(503, defaults)).toBe('retry')

    const dropAll5xx: ResolvedBackoffConfig = {
      ...defaults,
      statusCodeOverrides: {},
      default5xxBehavior: 'drop',
    }
    expect(getStatusBehavior(500, dropAll5xx)).toBe('drop')
    expect(getStatusBehavior(503, dropAll5xx)).toBe('drop')
  })

  it('falls back to default4xxBehavior for 4xx without override', () => {
    expect(getStatusBehavior(400, defaults)).toBe('drop')
    expect(getStatusBehavior(401, defaults)).toBe('drop')
    expect(getStatusBehavior(413, defaults)).toBe('drop')

    const retryAll4xx: ResolvedBackoffConfig = {
      ...defaults,
      statusCodeOverrides: {},
      default4xxBehavior: 'retry',
    }
    expect(getStatusBehavior(400, retryAll4xx)).toBe('retry')
    expect(getStatusBehavior(413, retryAll4xx)).toBe('retry')
  })

  it('statusCodeOverrides takes precedence over defaults', () => {
    const custom: ResolvedBackoffConfig = {
      ...defaults,
      default5xxBehavior: 'retry',
      statusCodeOverrides: { '500': 'drop' },
    }
    expect(getStatusBehavior(500, custom)).toBe('drop')
    expect(getStatusBehavior(502, custom)).toBe('retry')
  })

  it('returns drop for sub-400 statuses', () => {
    expect(getStatusBehavior(200, defaults)).toBe('drop')
    expect(getStatusBehavior(301, defaults)).toBe('drop')
  })
})

describe('parseRetryAfter', () => {
  const defaults = resolveHttpConfig().rateLimitConfig

  function makeRes(
    status: number,
    retryAfter?: string
  ): { status: number; headers: { get(name: string): string | null } } {
    const headers = new Headers()
    if (retryAfter !== undefined) {
      headers.set('Retry-After', retryAfter)
    }
    return { status, headers }
  }

  it('returns parsed value for 429 with valid Retry-After', () => {
    const result = parseRetryAfter(makeRes(429, '5'), defaults)
    expect(result).toEqual({ retryAfterMs: 5000, fromHeader: true })
  })

  it('returns parsed value for 408 with valid Retry-After', () => {
    const result = parseRetryAfter(makeRes(408, '10'), defaults)
    expect(result).toEqual({ retryAfterMs: 10000, fromHeader: true })
  })

  it('returns parsed value for 503 with valid Retry-After', () => {
    const result = parseRetryAfter(makeRes(503, '2'), defaults)
    expect(result).toEqual({ retryAfterMs: 2000, fromHeader: true })
  })

  it('returns null for non-eligible statuses', () => {
    expect(parseRetryAfter(makeRes(500, '5'), defaults)).toBeNull()
    expect(parseRetryAfter(makeRes(400, '5'), defaults)).toBeNull()
    expect(parseRetryAfter(makeRes(200, '5'), defaults)).toBeNull()
    expect(parseRetryAfter(makeRes(502, '5'), defaults)).toBeNull()
  })

  it('returns null when Retry-After header is missing', () => {
    expect(parseRetryAfter(makeRes(429), defaults)).toBeNull()
  })

  it('returns null when Retry-After header is not a number', () => {
    expect(parseRetryAfter(makeRes(429, 'not-a-number'), defaults)).toBeNull()
  })

  it('clamps Retry-After to maxRetryInterval', () => {
    const result = parseRetryAfter(makeRes(429, '500'), defaults)
    expect(result).toEqual({ retryAfterMs: 300000, fromHeader: true })
  })

  it('respects custom maxRetryInterval', () => {
    const custom: ResolvedRateLimitConfig = {
      ...defaults,
      maxRetryInterval: 10,
    }
    const result = parseRetryAfter(makeRes(429, '30'), custom)
    expect(result).toEqual({ retryAfterMs: 10000, fromHeader: true })
  })

  it('clamps negative Retry-After values to 0', () => {
    const result = parseRetryAfter(makeRes(429, '-5'), defaults)
    expect(result).toEqual({ retryAfterMs: 0, fromHeader: true })
  })
})

describe('computeBackoff', () => {
  const noJitter: ResolvedBackoffConfig = {
    ...resolveHttpConfig().backoffConfig,
    jitterPercent: 0,
  }

  it('returns baseBackoffInterval * 1000 for attempt 1 with no jitter', () => {
    expect(computeBackoff(1, noJitter)).toBe(500) // 0.5s * 1000
  })

  it('doubles with each attempt', () => {
    expect(computeBackoff(1, noJitter)).toBe(500)
    expect(computeBackoff(2, noJitter)).toBe(1000)
    expect(computeBackoff(3, noJitter)).toBe(2000)
    expect(computeBackoff(4, noJitter)).toBe(4000)
  })

  it('caps at maxBackoffInterval', () => {
    const config: ResolvedBackoffConfig = {
      ...noJitter,
      baseBackoffInterval: 1,
      maxBackoffInterval: 5,
    }
    // attempt 1: 1000, 2: 2000, 3: 4000, 4: 5000 (capped)
    expect(computeBackoff(3, config)).toBe(4000)
    expect(computeBackoff(4, config)).toBe(5000)
    expect(computeBackoff(10, config)).toBe(5000)
  })

  it('applies jitter within expected range', () => {
    const config: ResolvedBackoffConfig = {
      ...resolveHttpConfig().backoffConfig,
      baseBackoffInterval: 1,
      maxBackoffInterval: 300,
      jitterPercent: 50,
    }
    // With 50% jitter, attempt 1 (base 1000ms) should be in [500, 1500]
    for (let i = 0; i < 50; i++) {
      const result = computeBackoff(1, config)
      expect(result).toBeGreaterThanOrEqual(500)
      expect(result).toBeLessThanOrEqual(1500)
    }
  })

  it('never returns negative', () => {
    const config: ResolvedBackoffConfig = {
      ...resolveHttpConfig().backoffConfig,
      jitterPercent: 100,
    }
    for (let i = 0; i < 50; i++) {
      expect(computeBackoff(1, config)).toBeGreaterThanOrEqual(0)
    }
  })
})
