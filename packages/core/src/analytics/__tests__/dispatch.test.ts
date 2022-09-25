/**
 * Properly type mocked functions to make it easy to do assertions
 * for example, myModule.mock.calls[0] will have the typed parameters instead of any.
 *
 * TODO: share with rest of project
 */
type JestMockedFn<Fn> = Fn extends (...args: infer Args) => infer ReturnT
  ? jest.Mock<ReturnT, Args>
  : never

const isOnline = jest.fn().mockReturnValue(true)
const isOffline = jest.fn().mockReturnValue(false)

jest.mock('../../connection', () => ({
  isOnline,
  isOffline,
}))

const fetcher: JestMockedFn<typeof import('node-fetch')['default']> = jest.fn()
jest.mock('node-fetch', () => fetcher)

const invokeCallback: JestMockedFn<
  typeof import('../../callback')['invokeCallback']
> = jest.fn()
jest.mock('../../callback', () => ({
  invokeCallback: invokeCallback,
}))

import { EventQueue } from '../../queue/event-queue'
import { Emitter } from '../../emitter'
import { dispatch, getDelay } from '../dispatch'
import { PriorityQueue } from '../../priority-queue'
import { CoreContext } from '../../context'

let emitter!: Emitter
let queue!: EventQueue
const dispatchSingleSpy = jest.spyOn(EventQueue.prototype, 'dispatchSingle')
const dispatchSpy = jest.spyOn(EventQueue.prototype, 'dispatch')
const screenCtxMatcher = expect.objectContaining<Partial<CoreContext>>({
  event: { type: 'screen' },
})
describe('Dispatch', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    dispatchSingleSpy.mockImplementationOnce((ctx) => Promise.resolve(ctx))
    invokeCallback.mockImplementationOnce((ctx) => Promise.resolve(ctx))
    dispatchSpy.mockImplementationOnce((ctx) => Promise.resolve(ctx))
    queue = new EventQueue(new PriorityQueue(4, []))
    queue.isEmpty = jest.fn().mockReturnValue(false)
    emitter = new Emitter()
  })

  it('should not dispatch if client is currently offline and retries are *disabled* for the main event queue', async () => {
    isOnline.mockReturnValue(false)
    isOffline.mockReturnValue(true)

    const ctx = await dispatch({ type: 'screen' }, queue, emitter, {
      retryQueue: false,
    })
    expect(ctx).toEqual(screenCtxMatcher)
    const called = Boolean(
      dispatchSingleSpy.mock.calls.length || dispatchSpy.mock.calls.length
    )
    expect(called).toBeFalsy()
  })

  it('should be allowed to dispatch if client is currently offline and retries are *enabled* for the main event queue', async () => {
    isOnline.mockReturnValue(false)
    isOffline.mockReturnValue(true)

    await dispatch({ type: 'screen' }, queue, emitter, {
      retryQueue: true,
    })
    const called = Boolean(
      dispatchSingleSpy.mock.calls.length || dispatchSpy.mock.calls.length
    )
    expect(called).toBeTruthy()
  })

  it('should call dispatchSingle correctly if queue is empty', async () => {
    queue.isEmpty = jest.fn().mockReturnValue(true)
    await dispatch({ type: 'screen' }, queue, emitter)
    expect(dispatchSingleSpy).toBeCalledWith(screenCtxMatcher)
    expect(dispatchSpy).not.toBeCalled()
  })

  it('should call dispatch correctly if queue has items', async () => {
    await dispatch({ type: 'screen' }, queue, emitter)
    expect(dispatchSpy).toBeCalledWith(screenCtxMatcher)
    expect(dispatchSingleSpy).not.toBeCalled()
  })

  it('should only call invokeCallback if callback is passed', async () => {
    await dispatch({ type: 'screen' }, queue, emitter)
    expect(invokeCallback).not.toBeCalled()

    const cb = jest.fn()
    await dispatch({ type: 'screen' }, queue, emitter, { callback: cb })
    expect(invokeCallback).toBeCalledTimes(1)
  })
  it('should call invokeCallback with correct args', async () => {
    const cb = jest.fn()
    await dispatch({ type: 'screen' }, queue, emitter, {
      callback: cb,
    })
    expect(dispatchSpy).toBeCalledWith(screenCtxMatcher)
    expect(invokeCallback).toBeCalledTimes(1)
    const [ctx, _cb] = invokeCallback.mock.calls[0]
    expect(ctx).toEqual(screenCtxMatcher)
    expect(_cb).toBe(cb)
  })

  // TODO: Inconsistent behavior? This seems like a bug.
  it('should have inconsistent timeout behavior where the delay is different based on whether timeout is explicitly set to 1000 or not', async () => {
    {
      const TIMEOUT = 1000
      await dispatch({ type: 'screen' }, queue, emitter, {
        callback: jest.fn(),
        timeout: TIMEOUT,
      })
      const [, , delay] = invokeCallback.mock.calls[0]
      expect(delay).toBeGreaterThan(990) // ???
      expect(delay).toBeLessThanOrEqual(1000) // ???
    }
    {
      invokeCallback.mockReset()
      const TIMEOUT = undefined // this defaults to 1000 in the invokeCallback function
      await dispatch({ type: 'screen' }, queue, emitter, {
        callback: jest.fn(),
        timeout: TIMEOUT,
      })
      const [, , delay] = invokeCallback.mock.calls[0]
      expect(delay).toBeGreaterThan(290) // ???
      expect(delay).toBeLessThanOrEqual(300) // ???
    }
  })
})

describe(getDelay, () => {
  it('should calculate the amount of time to delay before invoking the callback', () => {
    const aShortTimeAgo = Date.now() - 200
    const timeout = 5000
    expect(Math.round(getDelay(aShortTimeAgo, timeout))).toBe(4800)
  })

  it('should have a sensible default', () => {
    const aShortTimeAgo = Date.now() - 200
    expect(Math.round(getDelay(aShortTimeAgo))).toBe(100)
  })
})
