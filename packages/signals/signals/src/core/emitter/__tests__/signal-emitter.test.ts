import { sleep } from '@segment/analytics-core'
import { Signal } from '@segment/analytics-signals-runtime'
import {
  SignalEmitter,
  SignalsMiddlewareContext,
  SignalsSubscriber,
  SignalsMiddleware,
} from '../index'

const mockCtx = {
  unstableGlobalSettings: {},
  analyticsInstance: {},
  buffer: {},
} as SignalsMiddlewareContext

describe(SignalEmitter, () => {
  let emitter: SignalEmitter
  let mockSubscriber: jest.Mocked<SignalsSubscriber>
  let mockSignal: Signal
  let mockMiddleware: jest.Mocked<SignalsMiddleware>

  beforeEach(() => {
    emitter = new SignalEmitter()
    mockSubscriber = {
      load: jest.fn(),
      process: jest.fn(),
    }
    mockSignal = { type: 'test', data: {} } as any as Signal
    mockMiddleware = {
      load: jest.fn(),
      process: jest.fn().mockReturnValue(mockSignal),
    }
  })

  it('should subscribe and unsubscribe a subscriber', async () => {
    emitter.subscribe(mockSubscriber)
    await emitter.start(mockCtx)

    emitter.emit(mockSignal)
    await sleep(0)
    expect(mockSubscriber.process).toHaveBeenCalledTimes(1)
    expect(mockSubscriber.process).toHaveBeenCalledWith(mockSignal)
    await emitter.unsubscribe(mockSubscriber)

    emitter.emit(mockSignal)

    expect(mockSubscriber.process).toHaveBeenCalledTimes(1)
  })

  it('should subscribe and unsubscribe if subscriber is a function', async () => {
    const mockSubscriber = jest.fn()
    emitter.subscribe(mockSubscriber)

    emitter.emit(mockSignal)

    expect(mockSubscriber).not.toHaveBeenCalledWith(mockSignal)

    await emitter.start(mockCtx)

    expect(mockSubscriber).toHaveBeenCalledTimes(1)
    expect(mockSubscriber).toHaveBeenCalledWith(mockSignal)
    await emitter.unsubscribe(mockSubscriber)

    emitter.emit(mockSignal)

    expect(mockSubscriber).toHaveBeenCalledTimes(1)
  })

  it('should allow subscribing after start is called', async () => {
    await emitter.start(mockCtx)

    const mockSubscriber = jest.fn()
    emitter.subscribe(mockSubscriber)

    emitter.emit(mockSignal)
    expect(mockSubscriber).toHaveBeenCalledTimes(1)
    expect(mockSubscriber).toHaveBeenCalledWith(mockSignal)
  })

  it('should handle multiple subscribers', async () => {
    const mockSubscriber2 = {
      load: jest.fn(),
      process: jest.fn(),
    }
    emitter.subscribe(mockSubscriber)
    emitter.subscribe(mockSubscriber2)

    emitter.emit(mockSignal)

    expect(mockSubscriber.process).not.toHaveBeenCalledWith(mockSignal)
    expect(mockSubscriber2.process).not.toHaveBeenCalledWith(mockSignal)

    await emitter.start(mockCtx)

    expect(mockSubscriber.process).toHaveBeenCalledTimes(1)
    expect(mockSubscriber.process).toHaveBeenCalledWith(mockSignal)
    expect(mockSubscriber2.process).toHaveBeenCalledTimes(1)
    expect(mockSubscriber2.process).toHaveBeenCalledWith(mockSignal)
  })

  it('should handle multiple unsubscriptions', async () => {
    await emitter.start(mockCtx)

    const anotherSubscriber: SignalsSubscriber = {
      load: jest.fn(),
      process: jest.fn(),
    }

    emitter.subscribe(mockSubscriber, anotherSubscriber)
    emitter.unsubscribe(mockSubscriber, anotherSubscriber)

    // Emit a signal to test if neither subscriber receives it
    emitter.emit(mockSignal)

    expect(mockSubscriber.process).not.toHaveBeenCalled()
    expect(anotherSubscriber.process).not.toHaveBeenCalled()
  })

  it('should buffer signals before initialization', async () => {
    emitter.emit(mockSignal)

    expect(mockSubscriber.process).not.toHaveBeenCalled()

    emitter.subscribe(mockSubscriber)
    await emitter.start(mockCtx)

    expect(mockSubscriber.process).toHaveBeenCalledWith(mockSignal)
    expect(mockSubscriber.process).toHaveBeenCalledTimes(1)
  })

  it('should process signals through middleware', async () => {
    emitter = await new SignalEmitter({ middleware: [mockMiddleware] })
      .subscribe(mockSubscriber)
      .start(mockCtx)

    emitter.emit(mockSignal)

    await sleep(0)

    expect(mockMiddleware.process).toHaveBeenCalledWith(mockSignal)
    expect(mockSubscriber.process).toHaveBeenCalledWith(mockSignal)
  })

  it('should run buffered signals through middleware', async () => {
    emitter = new SignalEmitter({ middleware: [mockMiddleware] }).subscribe(
      mockSubscriber
    )

    emitter.emit(mockSignal)

    await emitter.start(mockCtx)

    await sleep(0)

    expect(mockMiddleware.process).toHaveBeenCalledWith(mockSignal)
    expect(mockSubscriber.process).toHaveBeenCalledWith(mockSignal)
  })

  it('should drop signals if middleware returns null', async () => {
    mockMiddleware.process.mockReturnValueOnce(null)

    emitter = await new SignalEmitter({ middleware: [mockMiddleware] })
      .subscribe(mockSubscriber)
      .start(mockCtx)

    // drop signal
    emitter.emit(mockSignal)

    await sleep(0)

    expect(mockMiddleware.process).toHaveBeenCalledWith(mockSignal)
    expect(mockSubscriber.process).not.toHaveBeenCalled()
  })

  it('should not drop signals if middleware returns undefined', async () => {
    mockMiddleware.process.mockReturnValueOnce(undefined as any)

    emitter = await new SignalEmitter({ middleware: [mockMiddleware] })
      .subscribe(mockSubscriber)
      .start(mockCtx)

    emitter.emit(mockSignal)

    await sleep(0)

    expect(mockMiddleware.process).toHaveBeenCalledWith(mockSignal)
    expect(mockSubscriber.process).toHaveBeenCalledWith(mockSignal)
  })
})
