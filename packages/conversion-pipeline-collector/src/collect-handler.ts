import { CollectBodyError, parseCollectBody } from './parse-body'
import { normalizeCollectBatch, NormalizeError } from './normalize'
import type {
  CollectErrorResponse,
  CollectSuccessResponse,
  FlatEvent,
} from './types'

export type CollectHandlerResult = {
  status: number
  body: CollectSuccessResponse | CollectErrorResponse
  events: FlatEvent[]
}

export function handleCollectRequest(rawBody: unknown): CollectHandlerResult {
  try {
    const events = parseCollectBody(rawBody)
    const flat = normalizeCollectBatch(events)
    return {
      status: 202,
      body: { ok: true, queued: flat.length },
      events: flat,
    }
  } catch (error) {
    if (error instanceof CollectBodyError) {
      return {
        status: 400,
        body: { ok: false, error: error.code, detail: error.message },
        events: [],
      }
    }
    if (error instanceof NormalizeError) {
      return {
        status: 422,
        body: { ok: false, error: error.code, detail: error.message },
        events: [],
      }
    }
    return {
      status: 500,
      body: { ok: false, error: 'internal_error' },
      events: [],
    }
  }
}

/** Express-style middleware helper. */
export function createCollectRouteHandler(): (
  req: { body?: unknown },
  res: {
    status: (code: number) => { json: (body: unknown) => void }
  }
) => void {
  return (req, res) => {
    const result = handleCollectRequest(req.body)
    res.status(result.status).json(result.body)
  }
}
