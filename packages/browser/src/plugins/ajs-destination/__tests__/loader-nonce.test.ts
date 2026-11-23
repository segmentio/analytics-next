import { loadIntegration } from '../loader'
import { Context } from '../../../core/context'
import * as loader from '../../../lib/load-script'

describe('loadIntegration nonce', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    ;(window as any).amplitudeDeps = ['/dep-a', '/dep-b']
    ;(window as any).amplitudeLoader = jest.fn()
  })

  it('passes the nonce to the integration script and its dependencies', async () => {
    const spy = jest
      .spyOn(loader, 'loadScript')
      .mockResolvedValue(document.createElement('script'))

    await loadIntegration(Context.system(), 'amplitude', '1.0.0', {
      nonce: 'my-foo-nonce',
    })

    expect(spy).toHaveBeenCalledTimes(3)
    spy.mock.calls.forEach(([, attrs]) =>
      expect(attrs).toEqual({ nonce: 'my-foo-nonce' })
    )
  })

  it('does not pass attributes when no nonce is set', async () => {
    const spy = jest
      .spyOn(loader, 'loadScript')
      .mockResolvedValue(document.createElement('script'))

    await loadIntegration(Context.system(), 'amplitude', '1.0.0', {
      obfuscate: false,
    })

    spy.mock.calls.forEach(([, attrs]) => expect(attrs).toBeUndefined())
  })
})
