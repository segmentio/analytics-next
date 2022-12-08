import { LegacySettings } from '@segment/analytics-next'

type RemotePlugin = NonNullable<LegacySettings['remotePlugins']>[number]

export class SettingsBuilder {
  private settings: Record<string, any>
  constructor(baseSettings?: Record<string, any>) {
    this.settings = baseSettings || {
      integrations: {
        'Segment.io': {
          apiKey: 'writeKey',
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
      edgeFunction: {},
      analyticsNextEnabled: true,
      middlewareSettings: {} as any,
      enabledMiddleware: {},
      metrics: { sampleRate: 0.1, host: 'api.segment.io/v1' },
      legacyVideoPluginsEnabled: false,
      remotePlugins: [],
    }
  }

  addActionDestinationSettings(remotePlugin: RemotePlugin) {
    this.settings.remotePlugins.push(remotePlugin)
    const { subscriptions, ...rest } = remotePlugin.settings
    this.settings.integrations[remotePlugin.creationName] = rest
    return this
  }

  build() {
    return this.settings
  }
}
