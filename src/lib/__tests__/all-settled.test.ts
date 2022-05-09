import { allSettled } from '../all-settled'

describe('all settled', () => {
  it('should return a promise ', async () => {
    const result = allSettled([Promise.resolve('success')])
    expect(result).toBeInstanceOf(Promise)
  })

  it('should handle successes', async () => {
    const result = await allSettled([
      Promise.resolve('success'),
      Promise.resolve('success 2'),
    ])
    const response = [
      { status: 'fulfilled', value: 'success' },
      { status: 'fulfilled', value: 'success 2' },
    ]
    expect(result).toEqual(response)
  })

  it('should handle rejects', async () => {
    const result = await allSettled([
      Promise.reject('oops'),
      Promise.reject('oops 2'),
    ])
    const response = [
      { status: 'rejected', reason: 'oops' },
      { status: 'rejected', reason: 'oops 2' },
    ]
    expect(result).toEqual(response)
  })

  it('should handle mixes of fulfilled/reject', async () => {
    const result = await allSettled([
      Promise.reject('oops'),
      Promise.resolve(2),
    ])
    const response = [
      { status: 'rejected', reason: 'oops' },
      { status: 'fulfilled', value: 2 },
    ]
    expect(result).toEqual(response)
  })

  it('should handle mixes of fulfilled/reject / respect order', async () => {
    const result = await allSettled([
      Promise.resolve(2),
      Promise.reject('oops'),
    ])
    const response = [
      { status: 'fulfilled', value: 2 },
      { status: 'rejected', reason: 'oops' },
    ]
    expect(result).toEqual(response)
  })

  it('should resolve any non-promises passed', async () => {
    const result = await allSettled([2 as any, Promise.reject('oops 2')])
    const response = [
      { status: 'fulfilled', value: 2 },
      { status: 'rejected', reason: 'oops 2' },
    ]
    expect(result).toEqual(response)
  })

  it('should never call catch block', async () => {
    const result = await allSettled([
      Promise.reject('oops'),
      Promise.reject('oops 2'),
    ]).catch(() => {
      throw new Error('fail')
    })
    const response = [
      { status: 'rejected', reason: 'oops' },
      { status: 'rejected', reason: 'oops 2' },
    ]
    expect(result).toEqual(response)
  })
})
