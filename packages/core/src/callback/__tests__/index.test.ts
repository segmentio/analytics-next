import { invokeCallback } from '..'
import { TestCtx } from '../../../test-helpers'

describe(invokeCallback, () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('invokes a callback asynchronously', async () => {
    const ctx = new TestCtx({
      type: 'track',
    })

    const fn = jest.fn()
    const returned = await invokeCallback(ctx, fn, 0)

    expect(fn).toHaveBeenCalledWith(ctx)
    expect(returned).toBe(ctx)
  })

  // Fixes GitHub issue: https://github.com/segmentio/analytics-next/issues/409
  // A.JS classic waited for the timeout/delay before invoking callback,
  // so keep same behavior in A.JS next.
  it('calls the callback after a delay', async () => {
    const ctx = new TestCtx({
      type: 'track',
    })

    const fn = jest.fn()
    const delay = 100

    const startTime = Date.now()
    const returned = await invokeCallback(ctx, fn, delay)
    const endTime = Date.now()

    expect(fn).toHaveBeenCalled()
    expect(endTime - startTime).toBeGreaterThanOrEqual(delay - 1)
    expect(returned).toBe(ctx)
  })

  it('ignores the callback if it takes too long to resolve', async () => {
    const ctx = new TestCtx({
      type: 'track',
    })

    const slow = (_ctx: TestCtx): Promise<void> => {
      return new Promise((resolve) => {
        setTimeout(resolve, 1100)
      })
    }

    const returned = await invokeCallback(ctx, slow, 0)
    expect(returned).toBe(ctx)

    const logs = returned.logs()
    expect(logs[0].extras).toMatchInlineSnapshot(`
      {
        "error": [Error: Promise timed out],
      }
    `)

    expect(logs[0].level).toEqual('warn')
  })

  it('does not crash if the callback crashes', async () => {
    const ctx = new TestCtx({
      type: 'track',
    })

    const boo = (_ctx: TestCtx): Promise<void> => {
      throw new Error('👻 boo!')
    }

    const returned = await invokeCallback(ctx, boo, 0)
    expect(returned).toBe(ctx)

    const logs = returned.logs()
    expect(logs[0].extras).toMatchInlineSnapshot(`
      {
        "error": [Error: 👻 boo!],
      }
    `)
    expect(logs[0].level).toEqual('warn')
  })
})
