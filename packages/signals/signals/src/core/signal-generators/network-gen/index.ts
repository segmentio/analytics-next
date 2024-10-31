import { logger } from '../../../lib/logger'
import {
  NetworkSignalsFilter,
  NetworkSignalsFilterList,
} from './network-signals-filter'
import { createNetworkSignal } from '../../../types/factories'
import { SignalEmitter } from '../../emitter'
import { SignalsSettingsConfig } from '../../signals'
import { SignalGenerator } from '../types'
import {
  NetworkInterceptor,
  NetworkRequestHandler,
  NetworkResponseHandler,
} from './network-interceptor'
import {
  containsJSONContentType,
  containsJSONParseableContentType,
  tryJSONParse,
} from './helpers'

export type NetworkSettingsConfigSettings = Pick<
  SignalsSettingsConfig,
  | 'networkSignalsAllowList'
  | 'networkSignalsAllowSameDomain'
  | 'networkSignalsDisallowList'
>
export class NetworkSettingsConfig {
  networkSignalsAllowSameDomain: boolean
  networkSignalsFilterList: NetworkSignalsFilterList
  constructor({
    networkSignalsAllowList,
    networkSignalsDisallowList,
    networkSignalsAllowSameDomain,
  }: NetworkSettingsConfigSettings) {
    this.networkSignalsAllowSameDomain = networkSignalsAllowSameDomain ?? true
    this.networkSignalsFilterList = new NetworkSignalsFilterList(
      networkSignalsAllowList,
      networkSignalsDisallowList
    )
  }
}

export class NetworkGenerator implements SignalGenerator {
  id = 'network'

  private filter: NetworkSignalsFilter
  private interceptor = new NetworkInterceptor()
  /* List of all signal request IDs that have been emitted */
  private emittedRequestIds: string[] = []

  constructor(settings: NetworkSettingsConfig) {
    this.filter = new NetworkSignalsFilter(settings)
  }

  register(emitter: SignalEmitter) {
    const createMetadata = () => ({
      filters: this.filter.settings.networkSignalsFilterList.getRegexes(),
    })

    const handleRequest: NetworkRequestHandler = (rq) => {
      if (!containsJSONParseableContentType(rq.headers)) {
        return
      }

      if (!rq.url || !this.filter.isAllowed(rq.url)) {
        return
      }

      const data = typeof rq.body === 'string' ? tryJSONParse(rq.body) : null

      this.emittedRequestIds.push(rq.id)
      emitter.emit(
        createNetworkSignal(
          {
            action: 'request',
            url: rq.url,
            method: rq.method || 'GET',
            data,
            contentType: rq.headers?.get('content-type') || '',
          },
          createMetadata()
        )
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
      if (!url || !this.filter.isAllowed(url)) {
        return
      }

      const data = await rs.body()

      emitter.emit(
        createNetworkSignal(
          {
            action: 'response',
            url,
            data: data,
            ok: rs.ok,
            status: rs.status,
            contentType: rs.headers.get('content-type') || '',
          },
          createMetadata()
        )
      )
    }
    this.interceptor.addInterceptors(handleRequest, handleResponse)

    return () => {
      this.interceptor.cleanup()
      logger.debug('Removing fetch interceptor')
    }
  }
}
