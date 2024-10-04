import { logger } from '../../../lib/logger'
import {
  NetworkSignalsFilter,
  NetworkSignalsFilterList,
} from './network-signals-filter'
import { createNetworkSignal } from '../../../types'
import { SignalEmitter } from '../../emitter'
import { SignalsSettingsConfig } from '../../signals'
import { SignalGenerator } from '../types'
import {
  NetworkInterceptor,
  NetworkRequestHandler,
  NetworkResponseHandler,
} from './network-interceptor'
import { containsJSONContentType } from './helpers'

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
      if (!containsJSONContentType(rq.headers)) {
        return
      }

      if (!rq.url || !this.filter.isAllowed(rq.url)) {
        return
      }
      this.emittedRequestIds.push(rq.id)
      emitter.emit(
        createNetworkSignal(
          {
            action: 'request',
            url: rq.url,
            method: rq.method || 'GET',
            data: rq.body ? JSON.parse(rq.body.toString()) : null,
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
          },
          createMetadata()
        )
      )
    }
    this.interceptor.addInterceptors(handleRequest, handleResponse)

    // const handleXHRRequest: OnNetworkRequest = ([url, rq]) => {
    //   if (!rq || !rq.body) {
    //     return
    //   }

    //   if (!containsJSONContentType(rq.headers)) {
    //     return
    //   }
    //   const sUrl = url?.toString()
    //   if (!url || !this.filter.isAllowed(sUrl)) {
    //     return
    //   }

    //   emitter.emit(
    //     createNetworkSignal(
    //       {
    //         action: 'request',
    //         url: sUrl,
    //         method: rq.method,
    //         data: tryParseXHRBody(rq.body),
    //       },
    //       createMetadata()
    //     )
    //   )
    // }

    // const handleXHRResponse: onXHRResponse = ({
    //   headers,
    //   status,
    //   url,
    //   responseType,
    //   body,
    //   ok,
    // }) => {
    //   if (ok && responseType !== 'json' && !containsJSONContentType(headers)) {
    //     return
    //   }
    //   if (!url || !this.filter.isAllowed(url)) {
    //     return
    //   }

    //   emitter.emit(
    //     createNetworkSignal(
    //       {
    //         action: 'response',
    //         url: url,
    //         data: tryParseXHRBody(body),
    //         ok: ok,
    //         status: status,
    //       },
    //       createMetadata()
    //     )
    //   )
    // }
    return () => {
      this.interceptor.cleanup()
      logger.debug('Removing fetch interceptor')
    }
  }
}
