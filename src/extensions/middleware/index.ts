import { Facade, Options } from '@segment/facade'
import { Context } from '../../core/context'
import { SegmentEvent } from '../../core/events'
import { Extension } from '../../core/extension'

export class SegmentFacade extends Facade<SegmentEvent> {
  private _obj: SegmentEvent

  constructor(obj: SegmentEvent, options?: Options) {
    super(obj, options)
    this._obj = obj
  }

  get obj(): SegmentEvent {
    return this._obj
  }

  set obj(evt: SegmentEvent) {
    this._obj = evt
  }
}

export interface MiddlewareParams {
  payload: SegmentFacade

  integrations?: SegmentEvent['integrations']
  next: (payload: MiddlewareParams['payload'] | null) => void
}

export interface DestinationMiddlewareParams {
  payload: SegmentFacade
  integration: string
  next: (payload: MiddlewareParams['payload'] | null) => void
}

export type MiddlewareFunction = (middleware: MiddlewareParams) => void
export type DestinationMiddlewareFunction = (middleware: DestinationMiddlewareParams) => void

export async function applyDestinationMiddleware(
  destination: string,
  evt: SegmentEvent,
  middleware: DestinationMiddlewareFunction[]
): Promise<SegmentEvent | null> {
  async function applyMiddleware(event: SegmentEvent, fn: DestinationMiddlewareFunction): Promise<SegmentEvent | null> {
    return new Promise((resolve) => {
      fn({
        payload: new SegmentFacade(event, {
          clone: true,
          traverse: false,
        }),
        integration: destination,
        next(evt) {
          if (evt === null) {
            return resolve(null)
          }

          if (evt) {
            event = evt.obj
          }

          resolve(event)
        },
      })
    })
  }

  for (const md of middleware) {
    const result = await applyMiddleware(evt, md)
    if (result === null) {
      return null
    }
    evt = result
  }

  return evt
}

export function sourceMiddlewareExtension(fn: MiddlewareFunction): Extension {
  async function applyMiddleware(ctx: Context): Promise<Context> {
    return new Promise((resolve) => {
      fn({
        payload: new SegmentFacade(ctx.event, {
          clone: true,
          traverse: false,
        }),
        integrations: ctx.event.integrations ?? {},
        next(evt) {
          if (evt) {
            ctx.event = evt.obj
          }
          resolve(ctx)
        },
      })
    })
  }

  return {
    name: `Source Middleware ${fn.name}`,
    type: 'enrichment',
    version: '0.1.0',

    isLoaded: (): boolean => true,
    load: (ctx): Promise<Context> => Promise.resolve(ctx),

    track: applyMiddleware,
    page: applyMiddleware,
    identify: applyMiddleware,
    alias: applyMiddleware,
    group: applyMiddleware,
  }
}
