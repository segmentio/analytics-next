import { resolveInitConfig } from '../write-key-config'

describe('resolveInitConfig', () => {
  it('loads hardcoded config from writeKey', () => {
    const config = resolveInitConfig('conversion-pipeline')
    expect(config.writeKey).toBe('conversion-pipeline')
    expect(config.endpoint).toBe('/collect')
    expect(config.appName).toBe('conversion-pipeline')
    expect(config.enableGptSlotEvents).toBe(false)
  })

  it('merges options over writeKey defaults', () => {
    const config = resolveInitConfig('conversion-pipeline', {
      appName: 'custom-lp',
      debug: true,
    })
    expect(config.appName).toBe('custom-lp')
    expect(config.debug).toBe(true)
    expect(config.endpoint).toBe('/collect')
  })

  it('accepts legacy object config', () => {
    const config = resolveInitConfig({
      endpoint: '/collector',
      appName: 'legacy',
    })
    expect(config.endpoint).toBe('/collector')
    expect(config.appName).toBe('legacy')
  })
})
