import { Analytics } from './analytics'
import { Context } from './core/context'
import { allSettled } from './lib/all-settled'

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

export function flushAnalyticsCallsInNewTask(
  analytics: Analytics,
  buffer: PreInitMethodCallBuffer
): void {
  buffer.toArray().forEach((m) => {
    setTimeout(() => {
      callAnalyticsMethod(analytics, m).catch(console.error)
    }, 0)
  })
}

async function flushAnalyticsCallsConcurrentlyByName(
  name: PreInitMethodName,
  analytics: Analytics,
  buffer: PreInitMethodCallBuffer
): Promise<void> {
  await allSettled(
    buffer.getCalls(name).map((c) => {
      return callAnalyticsMethod(analytics, c).catch(console.error)
    })
  )
}

async function flushAnalyticsCallsSeriallyByName(
  name: PreInitMethodName,
  analytics: Analytics,
  buffer: PreInitMethodCallBuffer
): Promise<void> {
  for (const c of buffer.getCalls(name)) {
    await callAnalyticsMethod(analytics, c).catch(console.error)
  }
}

export const flushAddSourceMiddleware = flushAnalyticsCallsSeriallyByName.bind(
  this,
  'addSourceMiddleware'
)

export const flushOn = flushAnalyticsCallsConcurrentlyByName.bind(this, 'on')

export const flushSetAnonymousID = flushAnalyticsCallsConcurrentlyByName.bind(
  this,
  'setAnonymousId'
)
/**
 *  Represents a buffered method call that occurred before initialization.
 */
export interface PreInitMethodCall<
  MethodName extends PreInitMethodName = PreInitMethodName
> {
  method: MethodName
  args: PreInitMethodParams<MethodName>
  called: boolean
  resolve: (v: ReturnTypeUnwrap<Analytics[MethodName]>) => void
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

type PreInitMethodParams<MethodName extends PreInitMethodName> = Parameters<
  Analytics[MethodName]
>

type SnippetWindowBufferedMethodCall<
  MethodName extends PreInitMethodName = PreInitMethodName
> = [MethodName, ...PreInitMethodParams<MethodName>]

/**
 * A list of the method calls before initialization for snippet users
 * For example, [["track", "foo", {bar: 123}], ["page"], ["on", "ready", function(){..}]
 */
type SnippetBuffer = SnippetWindowBufferedMethodCall[]

/**
 * Fetch the buffered method calls from the window object and normalize them.
 */
export const getSnippetWindowBuffer = (): PreInitMethodCall[] => {
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

type MethodCallMap = Partial<Record<PreInitMethodName, PreInitMethodCall[]>>

/**
 *  Represents any and all the buffered method calls that occurred before initialization.
 */
export class PreInitMethodCallBuffer {
  private _value = {} as MethodCallMap

  public toArray(): PreInitMethodCall[] {
    return Object.values(this._value).reduce((acc, v) => {
      return acc.concat(...v)
    }, [] as PreInitMethodCall[])
  }

  public getCalls(methodName: PreInitMethodName): PreInitMethodCall[] {
    return this._value[methodName] || []
  }

  push(...calls: PreInitMethodCall[]): void {
    calls.forEach((el) => {
      if (this._value[el.method]) {
        this._value[el.method]?.push(el)
      } else {
        this._value[el.method] = [el]
      }
    })
  }

  clear(): void {
    this._value = {} as MethodCallMap
  }
}

/**
 *  Call method and mark as "called"
 *  This function should never throw an error
 */
export async function callAnalyticsMethod<T extends PreInitMethodName>(
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

type AnalyticsLoader = (
  preInitBuffer: PreInitMethodCallBuffer
) => Promise<[Analytics, Context]>

export class AnalyticsBuffered implements PromiseLike<[Analytics, Context]> {
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

  then<T1, T2 = never>(
    ...args: [
      onfulfilled:
        | ((instance: [Analytics, Context]) => T1 | PromiseLike<T1>)
        | null
        | undefined,
      onrejected?: (reason: unknown) => T2 | PromiseLike<T2>
    ]
  ) {
    return this.promise.then(...args)
  }

  catch<TResult = never>(
    ...args: [
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null
    ]
  ) {
    return this.promise.catch(...args)
  }

  finally(...args: [onfinally?: (() => void) | undefined | null]) {
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
  on(...args: Parameters<Analytics['on']>) {
    if (this.instance) {
      return this.instance.on(...args)
    }

    this.preInitBuffer.push({
      method: 'on',
      args,
      resolve: () => {},
      reject: console.error,
      called: false,
    } as PreInitMethodCall)

    return this
  }
  addSourceMiddleware = this._createMethod('addSourceMiddleware')
  addIntegrationMiddleware = this._createMethod('addIntegrationMiddleware')
  setAnonymousId = this._createMethod('setAnonymousId')
  addDestinationMiddleware = this._createMethod('addDestinationMiddleware')
}
