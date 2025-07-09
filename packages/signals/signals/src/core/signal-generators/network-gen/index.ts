import { logger } from '../../../lib/logger'
import { createNetworkSignal } from '../../../types/factories'
import { SignalEmitter } from '../../emitter'
import { SignalGenerator } from '../types'
import {
  NetworkInterceptor,
  NetworkRequestHandler,
  NetworkResponseHandler,
} from './network-interceptor'
import { containsJSONContentType, tryJSONParse } from './helpers'

export class NetworkGenerator implements SignalGenerator {
  id = 'network'

  private interceptor = new NetworkInterceptor()
  /* List of all signal request IDs that have been emitted */
  private emittedRequestIds: string[] = []

  register(emitter: SignalEmitter) {
    const handleRequest: NetworkRequestHandler = (rq) => {
      if (!rq.url) {
        return
      }

      const body = typeof rq.body === 'string' ? tryJSONParse(rq.body) : null

      this.emittedRequestIds.push(rq.id)
      emitter.emit(
        createNetworkSignal({
          action: 'request',
          url: rq.url,
          method: rq.method || 'GET',
          body,
          contentType: rq.headers?.get('content-type') || '',
          requestId: rq.id,
        })
      )
    }

    const handleResponse: NetworkResponseHandler = async (rs) => {
      const isSuccessWithNonJSONResponse =
        rs.ok &&
        rs.responseType !== 'json' &&
        !containsJSONContentType(rs.headers)

      const isErrorButRequestNeverEmittted =
        !rs.ok && !this.emittedRequestIds.includes(rs.req.id)

      if (isSuccessWithNonJSONResponse || isErrorButRequestNeverEmittted) {
        return
      }
      const url = rs.url
      if (!url) {
        return
      }

      const data = await rs.body()

      emitter.emit(
        createNetworkSignal({
          action: 'response',
          url,
          body: data,
          ok: rs.ok,
          status: rs.status,
          contentType: rs.headers.get('content-type') || '',
          requestId: rs.req.id,
        })
      )
    }
    this.interceptor.addInterceptors(handleRequest, handleResponse)

    return () => {
      this.interceptor.cleanup()
      logger.debug('Removing fetch interceptor')
    }
  }
}
