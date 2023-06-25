import type { LegacySettings } from '@segment/analytics-next'
type RemotePlugin = NonNullable<LegacySettings['remotePlugins']>[0]

export type DestinationSettingsBuilderConfig = Partial<RemotePlugin> & {
  creationName: string

  // this is not part of the RemotePlugin type -- technically, it's part of integrations
  consentSettings?: {
    categories: string[]
  }
}

export class CDNSettingsBuilder {
  private settings: LegacySettings
  constructor({
    writeKey,
    baseCDNSettings,
  }: {
    writeKey?: string
    baseCDNSettings?: LegacySettings
  } = {}) {
    const settings = baseCDNSettings || {
      integrations: {
        'Segment.io': {
          apiKey: writeKey,
          unbundledIntegrations: [],
          addBundledMetadata: true,
          maybeBundledConfigIds: {},
          versionSettings: { version: '4.4.7', componentTypes: ['browser'] },
          apiHost: 'api.segment.io/v1',
        },
      },
      plan: {
        track: { __default: { enabled: true, integrations: {} } },
        identify: { __default: { enabled: true } },
        group: { __default: { enabled: true } },
      },
      middlewareSettings: {} as any,
      enabledMiddleware: {},
      metrics: { sampleRate: 0.1, host: 'api.segment.io/v1' },
      legacyVideoPluginsEnabled: false,
      remotePlugins: [],
    }
    this.settings = settings
  }

  addActionDestinationSettings<I extends DestinationSettingsBuilderConfig>(
    ...remotePluginSettingsAndMore: I[]
  ) {
    remotePluginSettingsAndMore.forEach((p) => {
      const remotePlugin: RemotePlugin = {
        creationName: p.creationName ?? 'mockCreationName',
        libraryName: p.libraryName ?? 'mockLibraryName',
        name: p.name ?? 'mockName',
        url: p.url ?? 'https://mock.com/mock.js',
        settings: { subscriptions: [], ...(p.settings || {}) },
      }
      this.settings.remotePlugins!.push(remotePlugin)
      const { subscriptions, ...remotePluginSettings } = remotePlugin.settings

      this.settings.integrations = {
        ...this.settings.integrations,
        [p.creationName]: {
          ...remotePluginSettings,
          ...(p.consentSettings ? { consentSettings: p.consentSettings } : {}),
        },
      }
    })
    return this
  }

  build() {
    return this.settings
  }
}
