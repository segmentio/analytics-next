import { AnalyticsRuntimePublicApi } from '../../types'
import {
  TrackArgs,
  IdentifyArgs,
  AliasArgs,
  GroupArgs,
  PageArgs,
  ScreenArgs,
} from './argument-types'

export type MethodName =
  | 'page'
  | 'identify'
  | 'track'
  | 'alias'
  | 'screen'
  | 'group'
/**
 * Buffer of any analytics calls made during the processing of a signal
 */
export type AnalyticsMethodCalls = Record<MethodName, any[]> & {
  reset: unknown[]
}
/**
 * Proxy around the analytics client
 */
export class AnalyticsRuntime implements AnalyticsRuntimePublicApi {
  private calls: AnalyticsMethodCalls = {
    page: [],
    identify: [],
    track: [],
    alias: [],
    screen: [],
    group: [],
    reset: [],
  }

  getCalls(): AnalyticsMethodCalls {
    return this.calls
  }

  /**
   * Stamp the context with the event origin to prevent infinite signal-event loops.
   */
  private createOptions(context?: Record<string, any>): Record<string, any> {
    if (!context) {
      return {}
    }
    return {
      context: { ...context, __eventOrigin: { type: 'Signal' } },
    }
  }

  // these methods need to be bound to the instance, rather than the prototype, in order to serialize correctly in the sandbox.
  track = (...args: TrackArgs) => {
    const [name, properties, context] = args
    try {
      this.calls.track.push([name, properties, this.createOptions(context)])
    } catch (err) {
      // wrapping all methods in a try/catch because throwing an error won't cause the error to surface inside of workerboxjs
      console.error(err)
    }
  }

  identify = (...args: IdentifyArgs) => {
    try {
      // @ts-ignore
      const [id, traits, context] = args
      this.calls.identify.push([id, traits, this.createOptions(context)])
    } catch (err) {
      console.error(err)
    }
  }

  alias = (...args: AliasArgs) => {
    try {
      const [userId, previousId, context] = args
      this.calls.alias.push([userId, previousId, this.createOptions(context)])
    } catch (err) {
      console.error(err)
    }
  }
  group = (...args: GroupArgs) => {
    try {
      // @ts-ignore
      const [id, traits, context] = args
      this.calls.group.push([id, traits, this.createOptions(context)])
    } catch (err) {
      console.error(err)
    }
  }

  page = (...args: PageArgs) => {
    try {
      const [name, category, props, context] = args
      // If name is not provided, but category is, we default to an empty string
      // This is a legacy behavior from the argument resolver
      const nameStr = !name && category ? '' : name
      this.calls.page.push([
        category,
        nameStr,
        props,
        this.createOptions(context),
      ])
    } catch (err) {
      console.error(err)
    }
  }

  screen = (...args: ScreenArgs) => {
    try {
      const [name, category, props, context] = args
      const nameStr = !name && category ? '' : name
      this.calls.screen.push([
        category,
        nameStr,
        props,
        this.createOptions(context),
      ])
    } catch (err) {
      console.error(err)
    }
  }

  reset = () => {
    this.calls.reset.push([])
  }
}
