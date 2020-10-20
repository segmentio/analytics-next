/* eslint-disable @typescript-eslint/no-floating-promises */
import { ajsDestinations } from '..'
import { mocked } from 'ts-jest/utils'
import unfetch from 'unfetch'

const cdnResponse = {
  integrations: {
    Zapier: {
      type: 'server',
    },
    WithNoVersion: {
      type: 'browser',
    },
    WithLegacyVersion: {
      version: '3.0.7',
      type: 'browser',
    },
    WithVersionSettings: {
      versionSettings: {
        version: '1.2.3',
      },
      type: 'browser',
    },
    WithVersionOverrides: {
      versionSettings: {
        version: '1.2.3',
        override: '9.9.9',
      },
      type: 'browser',
    },
    'Amazon S3': {},
  },
}

jest.mock('unfetch', () => {
  return jest.fn()
})

const fetchSettings = Promise.resolve({
  json: () => Promise.resolve(cdnResponse),
})

describe('ajsDestinations', () => {
  beforeEach(async () => {
    jest.resetAllMocks()
    /* eslint-disable @typescript-eslint/ban-ts-ignore */
    // @ts-ignore: ignore Response required fields
    mocked(unfetch).mockImplementation((): Promise<Response> => fetchSettings)
  })
  // This test should temporary. Once we deprecate `version`, we can change it
  // to `it('loads version overrides')`
  it('considers both legacy and new version formats', async () => {
    const destinations = await ajsDestinations('fakeWriteKey', {})
    const withLegacyVersion = destinations.find((d) => d.name === 'WithLegacyVersion')
    const withVersionSettings = destinations.find((d) => d.name === 'WithVersionSettings')
    const withVersionOverrides = destinations.find((d) => d.name === 'WithVersionOverrides')
    const withNoVersion = destinations.find((d) => d.name === 'WithNoVersion')

    expect(withLegacyVersion?.version).toBe('3.0.7')
    expect(withVersionSettings?.version).toBe('1.2.3')
    expect(withVersionOverrides?.version).toBe('9.9.9')
    expect(withNoVersion?.version).toBe('latest')
  })

  it('loads type:browser legacy ajs destinations from cdn', async () => {
    const destinations = await ajsDestinations('fakeWriteKey', {})
    expect(destinations.length).toBe(4)
  })

  it('ignores destinations of type:server', async () => {
    const destinations = await ajsDestinations('fakeWriteKey', {})
    expect(destinations.find((d) => d.name === 'Zapier')).toBe(undefined)
  })

  it('does not load integrations on All:false', async () => {
    const destinations = await ajsDestinations('fakeWriteKey', {
      All: false,
    })
    expect(unfetch).not.toHaveBeenCalled()
    expect(destinations.length).toBe(0)
  })
})
