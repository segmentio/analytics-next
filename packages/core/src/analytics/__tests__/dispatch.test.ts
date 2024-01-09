/**
 * Properly type mocked functions to make it easy to do assertions
 * for example, myModule.mock.calls[0] will have the typed parameters instead of any.
 *
 * TODO: share with rest of project
 */
type JestMockedFn<Fn> = Fn extends (...args: infer Args) => infer ReturnT
  ? jest.Mock<ReturnT, Args>
  : never

const invokeCallback: JestMockedFn<
  typeof import('../../callback')['invokeCallback']
> = jest.fn()
jest.mock('../../callback', () => ({
  invokeCallback: invokeCallback,
}))

import { CoreEventQueue } from '../../queue/event-queue'
import { Emitter } from '@segment/analytics-generic-utils'
import { dispatch, getDelay } from '../dispatch'
import { CoreContext } from '../../context'
import { TestCtx, TestEventQueue } from '../../../test-helpers'

let emitter!: Emitter
let queue!: CoreEventQueue<CoreContext>
const dispatchSingleSpy = jest.spyOn(CoreEventQueue.prototype, 'dispatchSingle')
const dispatchSpy = jest.spyOn(CoreEventQueue.prototype, 'dispatch')
const screenCtxMatcher = expect.objectContaining<Partial<CoreContext>>({
  event: { type: 'screen' },
})

const screenCtx = new TestCtx({ type: 'screen' })
describe('Dispatch', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    dispatchSingleSpy.mockImplementationOnce((ctx) => Promise.resolve(ctx))
    invokeCallback.mockImplementationOnce((ctx) => Promise.resolve(ctx))
    dispatchSpy.mockImplementationOnce((ctx) => Promise.resolve(ctx))
    queue = new TestEventQueue()
    queue.isEmpty = jest.fn().mockReturnValue(false)
    emitter = new Emitter()
  })

  it('should call dispatchSingle correctly if queue is empty', async () => {
    queue.isEmpty = jest.fn().mockReturnValue(true)
    await dispatch(screenCtx, queue, emitter)
    expect(dispatchSingleSpy).toBeCalledWith(screenCtxMatcher)
    expect(dispatchSpy).not.toBeCalled()
  })

  it('should call dispatch correctly if queue has items', async () => {
    await dispatch(screenCtx, queue, emitter)
    expect(dispatchSpy).toBeCalledWith(screenCtxMatcher)
    expect(dispatchSingleSpy).not.toBeCalled()
  })

  it('should only call invokeCallback if callback is passed', async () => {
    await dispatch(screenCtx, queue, emitter)
    expect(invokeCallback).not.toBeCalled()

    const cb = jest.fn()
    await dispatch(screenCtx, queue, emitter, {
      callback: cb,
    })
    expect(invokeCallback).toBeCalledTimes(1)
  })
  it('should call invokeCallback with correct args', async () => {
    const cb = jest.fn()
    await dispatch(screenCtx, queue, emitter, {
      callback: cb,
    })
    expect(dispatchSpy).toBeCalledWith(screenCtxMatcher)
    expect(invokeCallback).toBeCalledTimes(1)
    const [ctx, _cb] = invokeCallback.mock.calls[0]
    expect(ctx).toEqual(screenCtxMatcher)
    expect(_cb).toBe(cb)
  })
})

describe(getDelay, () => {
  it('should calculate the amount of time to delay before invoking the callback', () => {
    const aShortTimeAgo = Date.now() - 200
    const timeout = 5000
    const result = getDelay(aShortTimeAgo, timeout)
    expect(result).toBeLessThanOrEqual(4800)
    expect(result).toBeGreaterThanOrEqual(4790)
  })

  it('should have a sensible default', () => {
    const aShortTimeAgo = Date.now() - 200
    const result = getDelay(aShortTimeAgo)
    expect(result).toBeLessThanOrEqual(100)
    expect(result).toBeGreaterThanOrEqual(90)
  })
})
