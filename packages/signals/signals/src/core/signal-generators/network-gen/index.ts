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
  onXHRRequest,
  onXHRResponse,
  XMLHTTPRequestResponseBody,
} from './network-interceptor'
import { containsJSONContentType } from './helpers'
import { JSONValue } from '@segment/analytics-next'

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
  constructor(settings: NetworkSettingsConfig) {
    this.filter = new NetworkSignalsFilter(settings)
  }

  register(emitter: SignalEmitter) {
    const createMetadata = () => ({
      filters: this.filter.settings.networkSignalsFilterList.getRegexes(),
    })
    const handleFetchRequest = ([url, rq]: Parameters<typeof window.fetch>) => {
      if (!rq || !rq.body) {
        return
      }

      if (!containsJSONContentType(rq.headers)) {
        return
      }

      const sUrl = url?.toString()
      if (!url || !this.filter.isAllowed(sUrl)) {
        return
      }

      emitter.emit(
        createNetworkSignal(
          {
            action: 'request',
            url: sUrl,
            method: rq.method || 'GET',
            data: JSON.parse(rq.body.toString()),
          },
          createMetadata()
        )
      )
    }
    const handleFetchResponse = async (rs: Response) => {
      if (rs.status < 200 || rs.status >= 300) {
        return
      }
      if (!containsJSONContentType(rs.headers)) {
        return
      }
      const url = rs.url
      if (!url || !this.filter.isAllowed(url)) {
        return
      }

      const data = await rs.json()
      emitter.emit(
        createNetworkSignal(
          {
            action: 'response',
            url,
            data: data,
          },
          createMetadata()
        )
      )
    }
    this.interceptor.addFetchInterceptor(
      handleFetchRequest,
      handleFetchResponse
    )

    const handleXHRRequest: onXHRRequest = ([url, rq]) => {
      if (!rq || !rq.body) {
        return
      }

      if (!containsJSONContentType(rq.headers)) {
        return
      }
      const sUrl = url?.toString()
      if (!url || !this.filter.isAllowed(sUrl)) {
        return
      }

      emitter.emit(
        createNetworkSignal(
          {
            action: 'request',
            url: sUrl,
            method: rq.method,
            data: tryParseXHRBody(rq.body),
          },
          createMetadata()
        )
      )
    }

    const handleXHRResponse: onXHRResponse = ({
      body,
      headers,
      status,
      url,
      responseType,
    }) => {
      if (status < 200 || status >= 300) {
        return
      }
      if (responseType !== 'json' && !containsJSONContentType(headers)) {
        return
      }
      if (!url || !this.filter.isAllowed(url)) {
        return
      }

      emitter.emit(
        createNetworkSignal(
          {
            action: 'response',
            url: url,
            data: tryParseXHRBody(body),
          },
          createMetadata()
        )
      )
    }
    this.interceptor.addXhrInterceptor(handleXHRRequest, handleXHRResponse)
    return () => {
      this.interceptor.cleanup()
      logger.debug('Removing fetch interceptor')
    }
  }
}

function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return (
    Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() === 'object'
  )
}

const tryParseXHRBody = (
  body: XMLHTTPRequestResponseBody | XMLHttpRequestBodyInit
): JSONValue => {
  if (!body) {
    return null
  }

  if (isPlainObject(body) || Array.isArray(body)) {
    return body as JSONValue
  }
  try {
    return JSON.parse(body.toString())
  } catch (e) {
    return null
  }
}
