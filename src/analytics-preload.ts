import type { Analytics } from './analytics'
import type { Context } from './core/context'

/**
 * The names of any Analytics instance methods that can be called pre-initialization.
 * These methods should exist statically on AnalyticsBrowser.
 */
type PreInitMethodName =
  | 'trackSubmit'
  | 'trackClick'
  | 'trackLink'
  | 'trackForm'
  | 'pageview'
  | 'identify'
  | 'reset'
  | 'group'
  | 'track'
  | 'ready'
  | 'alias'
  | 'debug'
  | 'page'
  | 'once'
  | 'off'
  | 'on'
  | 'addSourceMiddleware'
  | 'addIntegrationMiddleware'
  | 'setAnonymousId'
  | 'addDestinationMiddleware'

/**
 *  Represents a buffered method call that occurred before initialization.
 */
export interface PreInitMethodCall<
  T extends PreInitMethodName = PreInitMethodName
> {
  method: T
  args: Parameters<Analytics[T]>
  called: boolean
  resolve: (v: ReturnTypeUnwrap<Analytics[T]>) => void
  reject: (reason: any) => void
}

const normalizeSnippetBuffer = (buffer: SnippetBuffer): PreInitMethodCall[] => {
  return buffer.map(
    ([methodName, ...args]) =>
      ({
        method: methodName,
        resolve: () => {},
        reject: console.error,
        args,
        called: false,
      } as PreInitMethodCall)
  )
}

type SnippetWindowBufferedMethodArgs = any[]

type SnippetWindowBufferedMethodCall = [
  PreInitMethodName,
  ...SnippetWindowBufferedMethodArgs
]

/**
 * A list of the method calls before initialization for snippet users
 * For example, [["track", "foo", {bar: 123}], ["page"], ["on", "ready", function(){..}]
 */
type SnippetBuffer = SnippetWindowBufferedMethodCall[]

/**
 * Fetch the buffered method calls from the window object and normalize them.
 */
const getSnippetWindowBuffer = (): PreInitMethodCall[] => {
  const wa = window.analytics
  const buffered =
    // @ts-expect-error
    (wa && wa[0] ? [...wa] : []) as SnippetBuffer
  return normalizeSnippetBuffer(buffered)
}
/**
 * Infer return type; if return type is promise, unwrap it.
 */
type ReturnTypeUnwrap<Fn> = Fn extends (...args: any[]) => infer ReturnT
  ? ReturnT extends PromiseLike<infer Unwrapped>
    ? Unwrapped
    : ReturnT
  : never

export class PreInitMethodCallBuffer {
  /**
   *  Represents any and all the buffered method calls that occurred before initialization.
   */
  private _list: PreInitMethodCall[] = []

  private _windowBuffer: PreInitMethodCall[] = []

  public saveSnippetWindowBuffer() {
    // store reference in order to be be to mutate 'method.called' field from callers.
    this._windowBuffer = getSnippetWindowBuffer()
  }

  public get list(): PreInitMethodCall[] {
    return [...this._list, ...this._windowBuffer]
  }

  push(...calls: PreInitMethodCall[]) {
    this._list.push(...calls)
  }

  clear(): void {
    this._list = []
  }

  /**
   *  Call method and mark as "called"
   *  This function should never throw an error
   */
  async callMethod<T extends PreInitMethodName>(
    analytics: Analytics,
    methodCall: PreInitMethodCall<T>
  ): Promise<void> {
    const { method, args, resolve, reject } = methodCall
    try {
      if (methodCall.called) {
        return undefined
      }

      methodCall.called = true

      const result = await (analytics[method] as Function)(...args)
      resolve(result)
    } catch (err) {
      reject(err)
    }
  }
}

type AnalyticsLoader = (
  preInitBuffer: PreInitMethodCallBuffer
) => Promise<[Analytics, Context]>

export class AnalyticsBuffered {
  public instance?: Analytics
  public ctx?: Context
  private preInitBuffer = new PreInitMethodCallBuffer()
  private promise: Promise<[Analytics, Context]>
  constructor(loader: AnalyticsLoader) {
    this.promise = loader(this.preInitBuffer)
    this.promise
      .then(([ajs, ctx]) => {
        this.instance = ajs
        this.ctx = ctx
      })
      .catch(() => {
        // intentionally do nothing...
        // this result of this promise will be caught by the 'catch' block on this class.
      })
  }

  private _createMethod<T extends PreInitMethodName>(methodName: T) {
    return async (
      ...args: Parameters<Analytics[T]>
    ): Promise<ReturnTypeUnwrap<Analytics[T]>> => {
      if (this.instance) {
        return (this.instance[methodName] as any)(...args)
      }

      return new Promise((resolve, reject) => {
        this.preInitBuffer.push({
          method: methodName,
          args,
          resolve: resolve,
          reject: reject,
          called: false,
        } as PreInitMethodCall)
      })
    }
  }

  then(...args: Parameters<Promise<[Analytics, Context]>['then']>) {
    return this.promise.then(...args)
  }

  catch(...args: Parameters<Promise<[Analytics, Context]>['catch']>) {
    return this.promise.catch(...args)
  }

  finally(...args: Parameters<Promise<[Analytics, Context]>['finally']>) {
    return this.promise.finally(...args)
  }

  trackSubmit = this._createMethod('trackSubmit')
  trackClick = this._createMethod('trackClick')
  trackLink = this._createMethod('trackLink')
  pageView = this._createMethod('pageview')
  identify = this._createMethod('identify')
  reset = this._createMethod('reset')
  group = this._createMethod('group')
  track = this._createMethod('track')
  ready = this._createMethod('ready')
  alias = this._createMethod('alias')
  debug = this._createMethod('debug')
  page = this._createMethod('page')
  once = this._createMethod('once')
  off = this._createMethod('off')
  on = this._createMethod('on')
  addSourceMiddleware = this._createMethod('addSourceMiddleware')
  addIntegrationMiddleware = this._createMethod('addIntegrationMiddleware')
  setAnonymousId = this._createMethod('setAnonymousId')
  addDestinationMiddleware = this._createMethod('addDestinationMiddleware')
}
