import { logger } from '../../../lib/logger'
import {
  NetworkSignalsFilter,
  NetworkSignalsFilterList,
} from './network-signals-filter'
import { createNetworkSignal } from '../../../types'
import { SignalEmitter } from '../../emitter'
import { SignalsSettingsConfig } from '../../signals'
import { normalizeUrl } from '../../../lib/normalize-url'
import { SignalGenerator } from '../types'
import { NetworkInterceptor } from './network-interceptor'
import { containsJSONContent } from './helpers'

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
    const handleRequest = ([url, rq]: Parameters<typeof window.fetch>) => {
      if (!rq || !rq.body) {
        return
      }

      if (!containsJSONContent(rq.headers)) {
        return
      }

      const sUrl = url?.toString()
      if (!url || !this.filter.isAllowed(sUrl)) {
        return
      }

      emitter.emit(
        createNetworkSignal({
          action: 'request',
          url: normalizeUrl(sUrl),
          method: rq.method || '',
          data: JSON.parse(rq.body.toString()),
        })
      )
    }
    const handleResponse = async (rs: Response) => {
      if (!containsJSONContent(rs.headers)) {
        return
      }
      const url = rs.url
      if (!url || !this.filter.isAllowed(url)) {
        return
      }

      const data = await rs.json()
      emitter.emit(
        createNetworkSignal({
          action: 'response',
          url: url,
          data: data,
        })
      )
    }
    this.interceptor.addFetchInterceptor(handleRequest, handleResponse)
    return () => {
      this.interceptor.cleanup()
      logger.debug('Removing fetch interceptor')
    }
  }
}
