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

  it('should support .addMiddleware method', async () => {
    emitter = await new SignalEmitter()
      .addMiddleware(mockMiddleware)
      .subscribe(mockSubscriber)
      .start(mockCtx)

    emitter.emit(mockSignal)

    await sleep(0)

    expect(mockMiddleware.process).toHaveBeenCalledWith(mockSignal)
    expect(mockSubscriber.process).toHaveBeenCalledWith(mockSignal)
  })

  it('should support .removeMiddleware method', async () => {
    emitter = await new SignalEmitter()
      .addMiddleware(mockMiddleware)
      .removeMiddleware(mockMiddleware)
      .subscribe(mockSubscriber)
      .start(mockCtx)

    emitter.emit(mockSignal)

    await sleep(0)

    expect(mockMiddleware.process).not.toHaveBeenCalled()
    expect(mockSubscriber.process).toHaveBeenCalled()
  })

  it('should support add and removeMiddleware after start', async () => {
    emitter = await new SignalEmitter().subscribe(mockSubscriber).start(mockCtx)
    emitter.addMiddleware(mockMiddleware)
    emitter.emit(mockSignal)

    await sleep(0)

    expect(mockMiddleware.process).toHaveBeenCalledTimes(1)

    emitter.removeMiddleware(mockMiddleware)

    emitter.emit(mockSignal)
    await sleep(0)
    expect(mockMiddleware.process).toHaveBeenCalledTimes(1)
  })

  it('should handle multiple middlewares being added', async () => {
    const mockMiddleware2 = {
      load: jest.fn(),
      process: jest.fn().mockReturnValue(mockSignal),
    }

    emitter = await new SignalEmitter()
      .addMiddleware(mockMiddleware, mockMiddleware2)
      .subscribe(mockSubscriber)
      .start(mockCtx)

    emitter.emit(mockSignal)

    await sleep(0)

    expect(mockMiddleware.process).toHaveBeenCalledWith(mockSignal)
    expect(mockMiddleware2.process).toHaveBeenCalledWith(mockSignal)
    expect(mockSubscriber.process).toHaveBeenCalledWith(mockSignal)
  })

  it('middleware should block the flushing of signals forall .load promises are resolved', async () => {
    class MockMiddleware1 implements SignalsMiddleware {
      process(signal: Signal): Signal | null {
        // @ts-ignore
        signal.foo = this.ctx
        return signal
      }
      ctx!: SignalsMiddlewareContext
      async load(ctx: SignalsMiddlewareContext): Promise<void> {
        await sleep(50)
        this.ctx = ctx
      }
    }
    const mockMiddleware1 = new MockMiddleware1()
    const processSpy1 = jest.spyOn(mockMiddleware1, 'process')
    const loadSpy1 = jest.spyOn(mockMiddleware1, 'load')

    const mockMiddleware2 =
      new (class MockMiddleware2 extends MockMiddleware1 {})()

    const processSpy2 = jest.spyOn(mockMiddleware2, 'process')
    const loadSpy2 = jest.spyOn(mockMiddleware2, 'load')

    emitter = new SignalEmitter().addMiddleware(
      mockMiddleware1,
      mockMiddleware2
    )

    emitter.emit(mockSignal)

    void emitter.start(mockCtx)

    await sleep(0)

    expect(processSpy1).not.toHaveBeenCalled()
    expect(processSpy2).not.toHaveBeenCalled()

    await sleep(50)

    expect(loadSpy1).toHaveBeenCalledTimes(1)
    expect(loadSpy2).toHaveBeenCalledTimes(1)

    expect(processSpy1).toHaveBeenCalledWith(mockSignal)
    expect(processSpy1).toHaveLastReturnedWith(
      expect.objectContaining({ foo: mockCtx })
    )
    expect(processSpy2).toHaveBeenCalledWith(mockSignal)
    expect(processSpy2).toHaveLastReturnedWith(
      expect.objectContaining({ foo: mockCtx })
    )
  })

  it('subscribers .load methods should NOT block the flushing of signals for other subscribers (only for themselves)', async () => {
    class MockSubscriber1 implements SignalsSubscriber {
      process(signal: Signal): Signal {
        return signal
      }
      ctx!: SignalsMiddlewareContext
      async load(ctx: SignalsMiddlewareContext): Promise<void> {
        this.ctx = ctx
      }
    }
    const mockSubscriber1 = new MockSubscriber1()
    const processSpy1 = jest.spyOn(mockSubscriber1, 'process')
    const loadSpy1 = jest.spyOn(mockSubscriber1, 'load')

    class MockSubscriber2 extends MockSubscriber1 {
      async load(): Promise<void> {
        await sleep(50)
      }
    }

    const mockSubscriber2 = new MockSubscriber2()
    const processSpy2 = jest.spyOn(mockSubscriber2, 'process')
    const loadSpy2 = jest.spyOn(mockSubscriber2, 'load')

    emitter = new SignalEmitter().subscribe(mockSubscriber1, mockSubscriber2)

    emitter.emit(mockSignal)

    void emitter.start(mockCtx)

    await sleep(0)

    expect(loadSpy1).toHaveBeenCalledTimes(1)
    expect(processSpy1).toHaveBeenCalledWith(mockSignal)
    // Subscriber 1 loads immediately and Subscriber 2 takes a while, but they shouldn't block eachother
    expect(loadSpy2).toHaveBeenCalledTimes(1)
    expect(processSpy2).not.toHaveBeenCalled()

    // Subscriber 2's load method should be resolved, so it should process the signal
    await sleep(50)
    expect(processSpy2).toHaveBeenCalledTimes(1)
  })
})
