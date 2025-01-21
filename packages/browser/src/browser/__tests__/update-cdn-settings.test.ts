import { AnalyticsBrowser } from '../..'
import { setGlobalCDNUrl } from '../../lib/parse-cdn'
import { remoteLoader } from '../../plugins/remote-loader'
import unfetch from 'unfetch'
import { createSuccess } from '../../test-helpers/factories'
import { cdnSettingsMinimal } from '../../test-helpers/fixtures'
jest.mock('unfetch')

const INTG_TO_DELETE = 'deleteMe'

const cdnSettings = {
  ...cdnSettingsMinimal,
  integrations: {
    ...cdnSettingsMinimal.integrations,
    [INTG_TO_DELETE]: { bar: true },
    otherIntegration: { foo: true },
  },
}
const mockFetchSettingsSuccessResponse = (cdnSettings: any) => {
  return jest
    .mocked(unfetch)
    .mockImplementation(() => createSuccess(cdnSettings))
}

jest.mock('../../plugins/remote-loader')
const remoteLoaderSpy = jest.fn().mockResolvedValue([])
jest.mocked(remoteLoader).mockImplementation(remoteLoaderSpy)

describe('updateCDNSettings configuration option', () => {
  beforeEach(() => {
    setGlobalCDNUrl(undefined as any)
    ;(window as any).analytics = undefined
  })
  it('should update the configuration options if they are passed directly', async () => {
    await AnalyticsBrowser.load(
      {
        writeKey: 'foo',
        cdnSettings,
      },
      {
        updateCDNSettings: (settings) => {
          delete settings.integrations.deleteMe
          return settings
        },
      }
    )
    const [arg1] = remoteLoaderSpy.mock.lastCall
    expect(arg1.integrations.otherIntegration).toEqual(
      cdnSettings.integrations.otherIntegration
    )
    expect(arg1.integrations[INTG_TO_DELETE]).toBeUndefined()
  })

  it('should update the configuration options if they are fetched', async () => {
    mockFetchSettingsSuccessResponse(cdnSettings)
    await AnalyticsBrowser.load(
      {
        writeKey: 'foo',
      },
      {
        updateCDNSettings: (settings) => {
          delete settings.integrations.deleteMe
          return settings
        },
      }
    )
    const [arg1] = remoteLoaderSpy.mock.lastCall
    expect(arg1.integrations.otherIntegration).toEqual(
      cdnSettings.integrations.otherIntegration
    )
    expect(arg1.integrations[INTG_TO_DELETE]).toBeUndefined()
  })
})
