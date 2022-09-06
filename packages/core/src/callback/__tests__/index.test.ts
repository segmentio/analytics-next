import { invokeCallback } from '..'
import { CoreContext } from '../../context'

describe(invokeCallback, () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('invokes a callback asynchronously', async () => {
    const ctx = new CoreContext({
      type: 'track',
    })

    const fn = jest.fn()
    const returned = await invokeCallback(ctx, fn, 0)

    expect(fn).toHaveBeenCalledWith(ctx)
    expect(returned).toBe(ctx)
  })

  // Fixes GitHub issue: https://github.com/segmentio/analytics-next/issues/409
  // A.JS classic waited for the timeout before invoking callback,
  // so keep same behavior in A.JS next.
  it('calls the callback after a timeout', async () => {
    const ctx = new CoreContext({
      type: 'track',
    })

    const fn = jest.fn()
    const timeout = 100

    const startTime = Date.now()
    const returned = await invokeCallback(ctx, fn, timeout)
    const endTime = Date.now()

    expect(fn).toHaveBeenCalled()
    expect(endTime - startTime).toBeGreaterThanOrEqual(timeout - 1)
    expect(returned).toBe(ctx)
  })

  it('ignores the callback after a timeout', async () => {
    const ctx = new CoreContext({
      type: 'track',
    })

    const slow = (_ctx: CoreContext): Promise<void> => {
      return new Promise((resolve) => {
        setTimeout(resolve, 200)
      })
    }

    const returned = await invokeCallback(ctx, slow, 0, 50)
    expect(returned).toBe(ctx)

    const logs = returned.logs()
    expect(logs[0].extras).toMatchInlineSnapshot(`
      Object {
        "error": [Error: Promise timed out],
      }
    `)

    expect(logs[0].level).toEqual('warn')
  })

  it('does not crash if the callback crashes', async () => {
    const ctx = new CoreContext({
      type: 'track',
    })

    const boo = (_ctx: CoreContext): Promise<void> => {
      throw new Error('👻 boo!')
    }

    const returned = await invokeCallback(ctx, boo, 0)
    expect(returned).toBe(ctx)

    const logs = returned.logs()
    expect(logs[0].extras).toMatchInlineSnapshot(`
      Object {
        "error": [Error: 👻 boo!],
      }
    `)
    expect(logs[0].level).toEqual('warn')
  })
})
