import { SandboxSettings, SandboxSettingsConfig } from '../sandbox'

describe(SandboxSettings, () => {
  const edgeFnResponseBody = `function processSignal() { console.log('hello world') }`
  const baseSettings: SandboxSettingsConfig = {
    functionHost: undefined,
    processSignal: undefined,
    edgeFnDownloadURL: 'http://example.com/download',
    edgeFnFetchClient: jest.fn().mockReturnValue(
      Promise.resolve({
        text: () => edgeFnResponseBody,
      })
    ),
  }
  test('initializes with provided settings', async () => {
    const sandboxSettings = new SandboxSettings({ ...baseSettings })
    expect(baseSettings.edgeFnFetchClient).toHaveBeenCalledWith(
      baseSettings.edgeFnDownloadURL
    )
    expect(await sandboxSettings.processSignal).toEqual(edgeFnResponseBody)
  })

  test('normalizes edgeFnDownloadURL when functionHost is provided', async () => {
    const settings: SandboxSettingsConfig = {
      ...baseSettings,
      processSignal: undefined,
      functionHost: 'newHost.com',
      edgeFnDownloadURL: 'https://original.com/download',
    }
    new SandboxSettings(settings)
    expect(baseSettings.edgeFnFetchClient).toHaveBeenCalledWith(
      'https://newHost.com/download'
    )
  })

  test('creates default processSignal when parameters are missing', async () => {
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {})
    const settings: SandboxSettingsConfig = {
      ...baseSettings,
      processSignal: undefined,
      edgeFnDownloadURL: undefined,
    }
    const sandboxSettings = new SandboxSettings(settings)
    expect(await sandboxSettings.processSignal).toEqual(
      'globalThis.processSignal = function processSignal() {}'
    )
    expect(baseSettings.edgeFnFetchClient).not.toHaveBeenCalled()
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('processSignal')
    )
  })
})
