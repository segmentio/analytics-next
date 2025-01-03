import { NetworkSettingsConfig } from '.'
import { RegexLike } from '../../../types/settings'
import { isSameDomain } from './helpers'

class NetworkFilterListItem {
  regexes: RegexLike[]
  private get combinedRegex(): RegExp {
    const normalizeRegex = (regex: RegExp | string): RegExp => {
      return typeof regex === 'string' ? new RegExp(regex) : regex
    }
    return new RegExp(
      this.regexes
        .map((val) => normalizeRegex(val))
        .map((r) => r.source)
        .join('|')
    )
  }
  constructor(regexes: RegexLike[]) {
    this.regexes = regexes
  }

  test(value: string): boolean {
    if (!this.regexes.length) {
      return false
    }
    return this.combinedRegex.test(value)
  }

  add(...regex: RegexLike[]) {
    this.regexes.push(...regex)
  }

  addURLLike(...urlLike: string[]) {
    const parsedRegexes = urlLike
      .map((domain) => this.urlToRegex(domain))
      .filter(<T>(val: T): val is NonNullable<T> => Boolean(val))
    this.add(...parsedRegexes)
  }

  private urlToRegex(urlLike: string): RegExp | undefined {
    const clean = urlLike.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    try {
      return new RegExp(clean)
    } catch (e) {
      console.error(`Invalid regex: ${clean}`, e)
    }
  }
}

export class NetworkSignalsFilterList {
  public allowed: NetworkFilterListItem
  public disallowed: NetworkFilterListItem
  private disallowedDefaults: NetworkFilterListItem

  constructor(
    allowList: RegexLike[] | undefined,
    disallowList: RegexLike[] | undefined
  ) {
    this.allowed = new NetworkFilterListItem(allowList || [])
    this.disallowed = new NetworkFilterListItem(disallowList || [])
    this.disallowedDefaults = new NetworkFilterListItem([
      'api.segment.io',
      'signals.segment.io',
      'cdn.segment.com',
    ])
  }

  isDisallowed(url: string): boolean {
    return this.disallowed.test(url) || this.disallowedDefaults.test(url)
  }

  isAllowed(url: string): boolean {
    return this.allowed.test(url)
  }

  getRegexes() {
    return {
      allowed: this.allowed.regexes.map((el) => el.toString()),
      disallowed: this.disallowed.regexes.map((el) => el.toString()),
    }
  }
}

export type NetworkSignalsFilterSettings = Pick<
  NetworkSettingsConfig,
  'networkSignalsAllowSameDomain' | 'networkSignalsFilterList'
>
export class NetworkSignalsFilter {
  settings: NetworkSignalsFilterSettings
  constructor(settings: NetworkSignalsFilterSettings) {
    this.settings = settings
  }
  isAllowed(url: string): boolean {
    const { networkSignalsFilterList, networkSignalsAllowSameDomain } =
      this.settings

    // anything that is disallowed takes precedence over the allow list.
    if (networkSignalsFilterList.isDisallowed(url)) {
      return false
    }

    const allowed =
      // allowed because it's in the allow list
      networkSignalsFilterList.isAllowed(url) ||
      // allowed because it's the same domain
      (networkSignalsAllowSameDomain && isSameDomain(url))
    return allowed
  }
}
