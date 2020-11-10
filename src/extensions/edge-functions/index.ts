import { Extension } from '../../core/extension'
import { SegmentEvent } from '../../core/events'
import { loadScript } from '../../lib/load-script'
import { LegacySettings } from '../../browser'
import { Context } from '../../core/context'

export interface EdgeFunction {
  (event: SegmentEvent): SegmentEvent | Promise<SegmentEvent> | null
}

export interface DestinationEdgeFunction {
  [destination: string]: EdgeFunction[]
}

export interface EdgeFunctions {
  sourceEdgeFns: Extension[]
  destinationEdgeFns: DestinationEdgeFunction
}

export async function applyDestinationEdgeFns(event: SegmentEvent, edgeFns: EdgeFunction[]): Promise<SegmentEvent> {
  for (const edgeFn of edgeFns) {
    event = (await Promise.resolve(edgeFn(event))) ?? event
  }

  return event
}

export async function applyEdgeFns(ctx: Context, edgeFns: EdgeFunction[]): Promise<Context> {
  for (const edgeFn of edgeFns) {
    ctx.event = (await Promise.resolve(edgeFn(ctx.event))) ?? ctx.event
  }

  return ctx
}

function sourceEdgeFunction(edgeFunction: EdgeFunction): Extension {
  const apply = (ctx: Context): Promise<Context> => applyEdgeFns(ctx, [edgeFunction])

  return {
    name: `Source Edge Function`,
    version: '0.1.0',
    type: 'enrichment',
    isLoaded: () => true,
    load: () => Promise.resolve(),

    page: apply,
    alias: apply,
    track: apply,
    identify: apply,
    group: apply,
  } as Extension
}

type RemoteMiddlewareResponse = {
  edge_function?: {
    sourceMiddleware: EdgeFunction[]
    destinationMiddleware: DestinationEdgeFunction
  }
}

export async function edgeFunctions(settings: LegacySettings): Promise<EdgeFunctions> {
  let sourceEdgeFns: Extension[] = []
  let destinationEdgeFns: DestinationEdgeFunction = {}

  if (settings.edgeFunction.downloadURL) {
    try {
      await loadScript(settings.edgeFunction.downloadURL)
      const edgeFunction = (window as RemoteMiddlewareResponse)['edge_function']

      if (edgeFunction) {
        sourceEdgeFns = edgeFunction.sourceMiddleware.map((middleware: EdgeFunction) => sourceEdgeFunction(middleware))
        destinationEdgeFns = edgeFunction.destinationMiddleware
      }
    } catch (_) {
      // continue regardless of error
    }
  }

  return {
    sourceEdgeFns,
    destinationEdgeFns,
  }
}
