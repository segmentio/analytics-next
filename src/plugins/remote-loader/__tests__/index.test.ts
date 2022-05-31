import * as loader from '../../../lib/load-script'
import { remoteLoader } from '..'
import { AnalyticsBrowser } from '../../../browser'
import { InitOptions } from '../../../analytics'

const pluginFactory = jest.fn()

describe('Remote Loader', () => {
  const window = global.window as any

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(console, 'warn').mockImplementation()

    // @ts-expect-error skipping the actual script injection part
    jest.spyOn(loader, 'loadScript').mockImplementation(() => {
      window.testPlugin = pluginFactory
      return Promise.resolve(true)
    })
  })

  it('should attempt to load a script from the url of each remotePlugin', async () => {
    await remoteLoader(
      {
        integrations: {},
        remotePlugins: [
          {
            name: 'remote plugin',
            url: 'cdn/path/to/file.js',
            libraryName: 'testPlugin',
            settings: {},
          },
        ],
      },
      {},
      {}
    )

    expect(loader.loadScript).toHaveBeenCalledWith('cdn/path/to/file.js')
  })

  it('should attempt to load a script from the obfuscated url of each remotePlugin', async () => {
    await remoteLoader(
      {
        integrations: {},
        remotePlugins: [
          {
            name: 'remote plugin',
            url: 'cdn/path/to/file.js',
            libraryName: 'testPlugin',
            settings: {},
          },
        ],
      },
      {},
      {},
      true
    )
    const btoaName = btoa('to').replace(/=/g, '')
    expect(loader.loadScript).toHaveBeenCalledWith(
      `cdn/path/${btoaName}/file.js`
    )
  })

  it('should attempt to load a script from a custom CDN', async () => {
    window.analytics = {}
    window.analytics._cdn = 'foo.com'
    await remoteLoader(
      {
        integrations: {},
        remotePlugins: [
          {
            name: 'remote plugin',
            url: 'https://cdn.segment.com/actions/file.js',
            libraryName: 'testPlugin',
            settings: {},
          },
        ],
      },
      {},
      {}
    )

    expect(loader.loadScript).toHaveBeenCalledWith('foo.com/actions/file.js')
  })

  it('should attempt calling the library', async () => {
    await remoteLoader(
      {
        integrations: {},
        remotePlugins: [
          {
            name: 'remote plugin',
            url: 'cdn/path/to/file.js',
            libraryName: 'testPlugin',
            settings: {
              name: 'Charlie Brown',
            },
          },
        ],
      },
      {},
      {}
    )

    expect(pluginFactory).toHaveBeenCalledTimes(1)
    expect(pluginFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Charlie Brown',
      })
    )
  })

  it('should not load remote plugins when integrations object contains all: false', async () => {
    await remoteLoader(
      {
        integrations: {},
        remotePlugins: [
          {
            name: 'remote plugin',
            url: 'cdn/path/to/file.js',
            libraryName: 'testPlugin',
            settings: {
              name: 'Charlie Brown',
            },
          },
        ],
      },
      { All: false },
      {}
    )

    expect(pluginFactory).toHaveBeenCalledTimes(0)
  })

  it('should load remote plugins when integrations object contains all: false but plugin: true', async () => {
    await remoteLoader(
      {
        integrations: {},
        remotePlugins: [
          {
            name: 'remote plugin',
            url: 'cdn/path/to/file.js',
            libraryName: 'testPlugin',
            settings: {
              name: 'Charlie Brown',
            },
          },
        ],
      },
      { All: false, 'remote plugin': true },
      {}
    )

    expect(pluginFactory).toHaveBeenCalledTimes(1)
    expect(pluginFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Charlie Brown',
      })
    )
  })

  it('should load remote plugin when integrations object contains plugin: false', async () => {
    await remoteLoader(
      {
        integrations: {},
        remotePlugins: [
          {
            name: 'remote plugin',
            url: 'cdn/path/to/file.js',
            libraryName: 'testPlugin',
            settings: {
              name: 'Charlie Brown',
            },
          },
        ],
      },
      { 'remote plugin': false },
      {}
    )

    expect(pluginFactory).toHaveBeenCalledTimes(0)
  })

  it('should skip remote plugins that arent callable functions', async () => {
    const plugins = await remoteLoader(
      {
        integrations: {},
        remotePlugins: [
          {
            name: 'remote plugin',
            url: 'cdn/path/to/file.js',
            libraryName: 'this wont resolve',
            settings: {},
          },
        ],
      },
      {},
      {}
    )

    expect(pluginFactory).not.toHaveBeenCalled()
    expect(plugins).toHaveLength(0)
  })

  it('should return all plugins resolved remotely', async () => {
    const one = {
      name: 'one',
      version: '1.0.0',
      type: 'before',
      load: () => {},
      isLoaded: () => true,
    }
    const two = {
      name: 'two',
      version: '1.0.0',
      type: 'before',
      load: () => {},
      isLoaded: () => true,
    }
    const three = {
      name: 'three',
      version: '1.0.0',
      type: 'enrichment',
      load: () => {},
      isLoaded: () => true,
    }

    const multiPluginFactory = jest.fn().mockImplementation(() => [one, two])
    const singlePluginFactory = jest.fn().mockImplementation(() => three)

    // @ts-expect-error not gonna return a script tag sorry
    jest.spyOn(loader, 'loadScript').mockImplementation((url: string) => {
      if (url === 'multiple-plugins.js') {
        window['multiple-plugins'] = multiPluginFactory
      } else {
        window['single-plugin'] = singlePluginFactory
      }
      return Promise.resolve(true)
    })

    const plugins = await remoteLoader(
      {
        integrations: {},
        remotePlugins: [
          {
            name: 'multiple plugins',
            url: 'multiple-plugins.js',
            libraryName: 'multiple-plugins',
            settings: { foo: true },
          },
          {
            name: 'single plugin',
            url: 'single-plugin.js',
            libraryName: 'single-plugin',
            settings: { bar: false },
          },
        ],
      },
      {},
      {}
    )

    expect(plugins).toHaveLength(3)
    expect(plugins).toEqual(expect.arrayContaining([one, two, three]))
    expect(multiPluginFactory).toHaveBeenCalledWith({ foo: true })
    expect(singlePluginFactory).toHaveBeenCalledWith({ bar: false })
  })

  it('should ignore plugins that fail to initialize', async () => {
    // @ts-expect-error not gonna return a script tag sorry
    jest.spyOn(loader, 'loadScript').mockImplementation((url: string) => {
      window['flaky'] = (): never => {
        throw Error('aaay')
      }

      window['asyncFlaky'] = async (): Promise<never> => {
        throw Error('aaay')
      }

      return Promise.resolve(true)
    })

    const plugins = await remoteLoader(
      {
        integrations: {},
        remotePlugins: [
          {
            name: 'flaky plugin',
            url: 'cdn/path/to/flaky.js',
            libraryName: 'flaky',
            settings: {},
          },
          {
            name: 'async flaky plugin',
            url: 'cdn/path/to/asyncFlaky.js',
            libraryName: 'asyncFlaky',
            settings: {},
          },
        ],
      },
      {},
      {}
    )

    expect(pluginFactory).not.toHaveBeenCalled()
    expect(plugins).toHaveLength(0)
    expect(console.warn).toHaveBeenCalledTimes(2)
  })

  it('ignores invalid plugins', async () => {
    const invalidPlugin = {
      name: 'invalid',
      version: '1.0.0',
    }

    const validPlugin = {
      name: 'valid',
      version: '1.0.0',
      type: 'enrichment',
      load: () => {},
      isLoaded: () => true,
    }

    // @ts-expect-error not gonna return a script tag sorry
    jest.spyOn(loader, 'loadScript').mockImplementation((url: string) => {
      if (url === 'valid') {
        window['valid'] = jest.fn().mockImplementation(() => validPlugin)
      } else {
        window['invalid'] = jest.fn().mockImplementation(() => invalidPlugin)
      }

      return Promise.resolve(true)
    })

    const plugins = await remoteLoader(
      {
        integrations: {},
        remotePlugins: [
          {
            name: 'valid plugin',
            url: 'valid',
            libraryName: 'valid',
            settings: { foo: true },
          },
          {
            name: 'invalid plugin',
            url: 'invalid',
            libraryName: 'invalid',
            settings: { bar: false },
          },
        ],
      },
      {},
      {}
    )

    expect(plugins).toHaveLength(1)
    expect(plugins).toEqual(expect.arrayContaining([validPlugin]))
    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  it('accepts settings overrides from merged integrations', async () => {
    const cdnSettings = {
      integrations: {
        remotePlugin: {
          name: 'Charlie Brown',
          version: '1.0',
        },
      },
      remotePlugins: [
        {
          name: 'remotePlugin',
          libraryName: 'testPlugin',
          url: 'cdn/path/to/file.js',
          settings: {
            name: 'Charlie Brown',
            version: '1.0',
            subscriptions: [],
          },
        },
      ],
    }

    const userOverrides = {
      remotePlugin: {
        name: 'Chris Radek',
      },
    }

    await remoteLoader(cdnSettings, userOverrides, {
      remotePlugin: {
        ...cdnSettings.integrations.remotePlugin,
        ...userOverrides.remotePlugin,
      },
    })

    expect(pluginFactory).toHaveBeenCalledTimes(1)
    expect(pluginFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Chris Radek',
        version: '1.0',
        subscriptions: [],
      })
    )
  })

  it('accepts settings overrides from options (AnalyticsBrowser)', async () => {
    const cdnSettings = {
      integrations: {
        remotePlugin: {
          name: 'Charlie Brown',
          version: '1.0',
        },
      },
      remotePlugins: [
        {
          name: 'remotePlugin',
          libraryName: 'testPlugin',
          url: 'cdn/path/to/file.js',
          settings: {
            name: 'Charlie Brown',
            version: '1.0',
            subscriptions: [],
          },
        },
      ],
    }

    const initOptions: InitOptions = {
      integrations: {
        remotePlugin: {
          name: 'Chris Radek',
        },
      },
    }

    await AnalyticsBrowser.load(
      {
        writeKey: 'key',
        cdnSettings,
      },
      initOptions
    )

    expect(pluginFactory).toHaveBeenCalledTimes(1)
    expect(pluginFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Chris Radek',
        version: '1.0',
        subscriptions: [],
      })
    )
  })
})
