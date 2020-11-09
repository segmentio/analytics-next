import { Extension } from '../../core/extension'
import { SegmentEvent } from '../../core/events'
import { loadScript } from '../../lib/load-script'
import { LegacySettings } from '../../browser'

export interface EdgeFunction {
  (event: SegmentEvent): SegmentEvent | null
}

export interface DestinationEdgeFunction {
  [destination: string]: EdgeFunction[]
}

export interface EdgeFunctions {
  sourceEdgeFns: Extension[]
  destinationEdgeFns: DestinationEdgeFunction
}

export function applyEdgeFns(event: SegmentEvent, edgeFns: EdgeFunction[]): SegmentEvent {
  for (const edgeFn of edgeFns) {
    event = edgeFn(event) ?? event
  }
  return event
}

function sourceEdgeFunction(edgeFunction: EdgeFunction): Extension {
  return {
    name: `Source Edge Function`,
    version: '0.1.0',
    type: 'enrichment',
    isLoaded: () => true,
    load: () => Promise.resolve(),

    async page(ctx) {
      ctx.event = applyEdgeFns(ctx.event, [edgeFunction])
      return ctx
    },
    async alias(ctx) {
      ctx.event = applyEdgeFns(ctx.event, [edgeFunction])
      return ctx
    },
    async track(ctx) {
      ctx.event = applyEdgeFns(ctx.event, [edgeFunction])
      return ctx
    },
    async identify(ctx) {
      ctx.event = applyEdgeFns(ctx.event, [edgeFunction])
      return ctx
    },
    async group(ctx) {
      ctx.event = applyEdgeFns(ctx.event, [edgeFunction])
      return ctx
    },
  } as Extension
}

export async function edgeFunctions(settings: LegacySettings): Promise<EdgeFunctions> {
  let sourceEdgeFns: Extension[] = []
  let destinationEdgeFns: DestinationEdgeFunction = {}

  if (settings.edgeFunction.downloadURL) {
    try {
      await loadScript(settings.edgeFunction.downloadURL)
      const edgeFunction = (window as { [key: string]: any })['edge_function']
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
