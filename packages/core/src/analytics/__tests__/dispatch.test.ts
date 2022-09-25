const isOnline = jest.fn().mockReturnValue(true)
const isOffline = jest.fn().mockReturnValue(false)

jest.mock('../../connection', () => ({
  isOnline,
  isOffline,
}))
const fetcher = jest.fn()
jest.mock('node-fetch', () => fetcher)

const invokeCallback = jest.fn()

jest.mock('../../callback', () => ({
  invokeCallback: invokeCallback,
}))

import { EventQueue } from '../../queue/event-queue'
import { Emitter } from '../../emitter'
import { dispatch, getDelay } from '../dispatch'
import { PriorityQueue } from '../../priority-queue'

let emitter!: Emitter
let queue!: EventQueue
const dispatchSingleSpy = jest.spyOn(EventQueue.prototype, 'dispatchSingle')
const dispatchSpy = jest.spyOn(EventQueue.prototype, 'dispatch')

beforeEach(() => {
  queue = new EventQueue(new PriorityQueue(4, []))
  emitter = new Emitter()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Dispatch', () => {
  it('should not dispatch if client is currently offline and retries are *disabled* for the main event queue', async () => {
    isOnline.mockReturnValue(false)
    isOffline.mockReturnValue(true)

    const ctx = await dispatch({ type: 'screen' }, queue, emitter, {
      retryQueue: false,
    })
    expect(ctx.event.type).toBe('screen')
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
    expect(dispatchSingleSpy).toBeCalledWith(
      expect.objectContaining({ event: { type: 'screen' } })
    )
    expect(dispatchSpy).not.toBeCalled()
  })

  it('should call dispatch correctly if queue has items', async () => {
    queue.isEmpty = jest.fn().mockReturnValue(false)
    await dispatch({ type: 'screen' }, queue, emitter)
    expect(dispatchSpy).toBeCalledWith(
      expect.objectContaining({ event: { type: 'screen' } })
    )
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
    expect(invokeCallback).toBeCalledWith(
      expect.objectContaining({ event: { type: 'screen' } }), // ctx
      cb, // callback
      expect.anything(),
      expect.anything()
    )
  })
  // TODO: Weird and inconsistent behavior
  it('should have bizarre and inconsistent timeout behavior where the delay is different based on whether timeout is explicitly set to 1000 or not', async () => {
    {
      const TIMEOUT = 1000
      await dispatch({ type: 'screen' }, queue, emitter, {
        callback: jest.fn(),
        timeout: TIMEOUT,
      })
      const [, , delay] = invokeCallback.mock.calls[0]
      // timeout = 1000, delay equals 998
      expect(delay).toBeGreaterThan(990)
      expect(delay).toBeLessThanOrEqual(1000)
    }
    {
      // wtf
      invokeCallback.mockReset()
      const TIMEOUT = undefined // this defaults to 1000 in the invokeCallback function
      await dispatch({ type: 'screen' }, queue, emitter, {
        callback: jest.fn(),
        timeout: TIMEOUT,
      })
      const [, , delay] = invokeCallback.mock.calls[0]
      expect(delay).toBeGreaterThan(290)
      expect(delay).toBeLessThanOrEqual(300)
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
