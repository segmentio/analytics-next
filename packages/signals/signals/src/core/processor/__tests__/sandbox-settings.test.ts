import { IframeSandboxSettings, IframeSandboxSettingsConfig } from '../sandbox'

describe(IframeSandboxSettings, () => {
  const edgeFnResponseBody = `function processSignal() { console.log('hello world') }`
  const baseSettings: IframeSandboxSettingsConfig = {
    processSignal: undefined,
    edgeFnDownloadURL: 'http://example.com/download',
    edgeFnFetchClient: jest.fn().mockReturnValue(
      Promise.resolve({
        text: () => edgeFnResponseBody,
      })
    ),
  }
  test('initializes with provided settings', async () => {
    const sandboxSettings = new IframeSandboxSettings({ ...baseSettings })
    expect(baseSettings.edgeFnFetchClient).toHaveBeenCalledWith(
      baseSettings.edgeFnDownloadURL
    )
    expect(await sandboxSettings.processSignal).toEqual(edgeFnResponseBody)
  })

  test('should call edgeFnDownloadURL', async () => {
    const settings: IframeSandboxSettingsConfig = {
      ...baseSettings,
      processSignal: undefined,
      edgeFnDownloadURL: 'https://foo.com/download',
    }
    new IframeSandboxSettings(settings)
    expect(baseSettings.edgeFnFetchClient).toHaveBeenCalledWith(
      'https://foo.com/download'
    )
  })

  test('creates default processSignal when parameters are missing', async () => {
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {})
    const settings: IframeSandboxSettingsConfig = {
      ...baseSettings,
      processSignal: undefined,
      edgeFnDownloadURL: undefined,
    }
    const sandboxSettings = new IframeSandboxSettings(settings)
    expect(await sandboxSettings.processSignal).toMatchInlineSnapshot(
      `"globalThis.processSignal = function() {}"`
    )
    expect(baseSettings.edgeFnFetchClient).not.toHaveBeenCalled()
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('processSignal')
    )
  })
})
