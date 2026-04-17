import { backoff } from '../backoff'

describe('backoff', () => {
  it('increases with the number of attempts', () => {
    expect(backoff({ attempt: 1 })).toBeGreaterThan(200)
    expect(backoff({ attempt: 2 })).toBeGreaterThan(400)
    expect(backoff({ attempt: 3 })).toBeGreaterThan(800)
    expect(backoff({ attempt: 4 })).toBeGreaterThan(1600)
  })

  it('accepts a max timeout', () => {
    expect(backoff({ attempt: 1, maxTimeout: 3000 })).toBeGreaterThan(200)
    expect(backoff({ attempt: 3, maxTimeout: 3000 })).toBeLessThanOrEqual(3000)
    expect(backoff({ attempt: 4, maxTimeout: 3000 })).toBeLessThanOrEqual(3000)
  })

  it('accepts a growth factor', () => {
    const f2 = backoff({ attempt: 2, factor: 2 })
    const f3 = backoff({ attempt: 2, factor: 3 })

    expect(f3).toBeGreaterThan(f2)
  })
})
