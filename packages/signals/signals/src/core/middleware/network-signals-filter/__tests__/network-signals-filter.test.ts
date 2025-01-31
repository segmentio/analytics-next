import {
  NetworkSettingsConfig,
  NetworkSettingsConfigSettings,
  NetworkSignalsFilter,
} from '../network-signals-filter'
import { setLocation } from '../../../../test-helpers/set-location'

describe(NetworkSignalsFilter, () => {
  class TestNetworkSignalsFilter extends NetworkSignalsFilter {
    constructor(settings: Partial<NetworkSettingsConfigSettings> = {}) {
      super(new NetworkSettingsConfig(settings))
    }
  }

  beforeEach(() => {
    setLocation({ hostname: 'localhost' })
  })

  it('should respect the allow/disallow list', () => {
    const filter = new TestNetworkSignalsFilter({
      networkSignalsAllowList: [
        new RegExp(`allowed.com/api/v1`),
        'foo.com/api/v2',
      ],
      networkSignalsDisallowList: [new RegExp(`allowed.com/api/v666`)],
    })

    // allowed
    expect(filter.isAllowed(`http://allowed.com/api/v1/test`)).toBe(true)
    // not allowed
    expect(filter.isAllowed(`http://allowed.com/api/v666`)).toBe(false)
  })

  it('will not allow signals for same domain if networkSignalsAllowSameDomain = false', () => {
    const filter = new TestNetworkSignalsFilter({
      networkSignalsAllowList: ['foo.com'],
      networkSignalsDisallowList: [],
      networkSignalsAllowSameDomain: false,
    })

    expect(filter.isAllowed(`http://${window.location.hostname}/test`)).toBe(
      false
    )
    expect(filter.isAllowed(`http://foo.com/test`)).toBe(true)
  })

  it('disallows the signal if it matches in both the allow and disallow list', () => {
    const filter = new TestNetworkSignalsFilter({
      networkSignalsAllowList: ['disallowed-api.com'],
      networkSignalsDisallowList: ['https://disallowed-api.com'],
    })

    expect(filter.isAllowed(`https://disallowed-api.com/api/foo`)).toBe(false)
  })

  it('allows an explicit disallow list to override same-domain signals', () => {
    const filter = new TestNetworkSignalsFilter({
      networkSignalsDisallowList: ['/foo'],
    })

    expect(filter.isAllowed(`/test/foo`)).toBe(false)
    expect(filter.isAllowed(`/test/bar`)).toBe(true)
  })

  it('always disallows segment api network signals', () => {
    const filter = new TestNetworkSignalsFilter({
      networkSignalsAllowList: ['.*'],
    })

    expect(filter.isAllowed(`https://api.segment.io`)).toBe(false)
  })
})
