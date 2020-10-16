/* eslint-disable @typescript-eslint/ban-ts-ignore */
import fetch from 'unfetch'
import { Context } from '../../core/context'
import { Extension } from '../../core/extension'
import { SegmentEvent } from '../../core/events'
import { loadScript } from '../../lib/load-script'

interface LegacySettings {
  edgeFunction: {
    downloadURL: string
  }
}

interface SourceMiddlewareFunc {
  // Signature for edge function
  (event: SegmentEvent): SegmentEvent | null
}

export interface EdgeFunction {
  sourceMiddleware: SourceMiddlewareFunc[]
}

function applyEdgeFunction(ctx: Context, func: SourceMiddlewareFunc): Context {
  const event = func(ctx.event)
  if (event) {
    ctx.event = event
  }
  return ctx
}

function edgeFunction(func: SourceMiddlewareFunc): Extension {
  return {
    name: `Edge Function ${func.name}`,
    version: '0.1.0',
    type: 'enrichment',
    isLoaded: () => true,
    load: () => Promise.resolve(),

    page: async (ctx) => applyEdgeFunction(ctx, func),
    alias: async (ctx) => applyEdgeFunction(ctx, func),
    track: async (ctx) => applyEdgeFunction(ctx, func),
    identify: async (ctx) => applyEdgeFunction(ctx, func),
    group: async (ctx) => applyEdgeFunction(ctx, func),
  } as Extension
}

export async function edgeFunctions(writeKey: string): Promise<Extension[]> {
  let settings: LegacySettings = {
    edgeFunction: {
      downloadURL: '',
    },
  }

  try {
    const settingsResponse = await fetch(`https://cdn-settings.segment.com/v1/projects/${writeKey}/settings`)
    settings = await settingsResponse.json()
  } catch (_) {
    // continue regardless of error
  }

  let sourceMiddlewareFuncs: SourceMiddlewareFunc[] = []

  if (settings.edgeFunction) {
    try {
      await loadScript(settings.edgeFunction.downloadURL)
      const edgeFunction = (window as { [key: string]: any })['edge_function'] as EdgeFunction
      if (edgeFunction) {
        sourceMiddlewareFuncs = edgeFunction.sourceMiddleware
      }
    } catch (_) {
      // continue regardless of error
    }
  }

  return sourceMiddlewareFuncs ? Object.values(sourceMiddlewareFuncs).map((func) => edgeFunction(func)) : []
}
