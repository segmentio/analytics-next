import { backoff, calculateMaxTotalRetryTime } from '../backoff'

describe('backoff', () => {
  it('increases with the number of attempts', () => {
    expect(backoff({ attempt: 1 })).toBeGreaterThan(1000)
    expect(backoff({ attempt: 2 })).toBeGreaterThan(2000)
    expect(backoff({ attempt: 3 })).toBeGreaterThan(3000)
    expect(backoff({ attempt: 4 })).toBeGreaterThan(4000)
  })

  it('accepts a max timeout', () => {
    expect(backoff({ attempt: 1, maxTimeout: 3000 })).toBeGreaterThan(1000)
    expect(backoff({ attempt: 3, maxTimeout: 3000 })).toBeLessThanOrEqual(3000)
    expect(backoff({ attempt: 4, maxTimeout: 3000 })).toBeLessThanOrEqual(3000)
  })

  it('accepts a growth factor', () => {
    const f2 = backoff({ attempt: 2, factor: 2 })
    const f3 = backoff({ attempt: 2, factor: 3 })

    expect(f3).toBeGreaterThan(f2)
  })

  it('accepts an optional multiplier', () => {
    expect(backoff({ attempt: 2, rand: 1 })).toBe(4000)
  })

  it('works with a rand of 0', () => {
    expect(backoff({ attempt: 2, rand: 0 })).toBe(2000)
  })
})

describe('calculateMaxBackoff', () => {
  it('gets the max backoff', () => {
    expect(calculateMaxTotalRetryTime(3)).toBe(14000)
  })
})
