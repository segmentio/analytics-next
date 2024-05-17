import { createDeferred } from '../create-deferred'

describe(createDeferred, () => {
  it('should return a deferred object', async () => {
    const o = createDeferred()
    expect(o.promise).toBeInstanceOf(Promise)
    expect(o.resolve).toBeInstanceOf(Function)
    expect(o.reject).toBeInstanceOf(Function)
  })
  it('should resolve', async () => {
    const { promise, resolve } = createDeferred<string>()
    let isResolved = false
    let isResolvedVal = undefined
    void promise.then((value) => {
      isResolvedVal = value
      isResolved = true
    })
    expect(isResolved).toBe(false)
    expect(isResolvedVal).toBeUndefined()
    await resolve('foo')
    expect(isResolved).toBe(true)
    expect(isResolvedVal).toBe('foo')
  })

  it('should reject', async () => {
    const { promise, reject } = createDeferred<string>()
    let isRejected = false
    let isRejectedVal = undefined
    void promise.catch((value) => {
      isRejectedVal = value
      isRejected = true
    })
    expect(isRejected).toBe(false)
    expect(isRejectedVal).toBeUndefined()
    await reject('foo')
    expect(isRejected).toBe(true)
    expect(isRejectedVal).toBe('foo')
  })

  test('isSettled return true on either reject or resolve', async () => {
    const deferred1 = createDeferred<string>()
    const deferred2 = createDeferred<string>()

    expect(deferred1.isSettled()).toBe(false)
    expect(deferred2.isSettled()).toBe(false)

    deferred1.resolve('foo')
    expect(deferred1.isSettled()).toBe(true)

    deferred2.promise.catch(() => {})
    deferred2.reject('foo')
    expect(deferred2.isSettled()).toBe(true)
  })
})
