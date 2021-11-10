import { Plugin } from '../../../core/plugin'
import { Analytics } from '../../../analytics'
import { Context } from '../../../core/context'
import { schemaFilter } from '..'
import { AnalyticsBrowser, LegacySettings } from '../../../browser'
import { TEST_WRITEKEY } from '../../../__tests__/test-writekeys'
import { segmentio, SegmentioSettings } from '../../segmentio'

const writeKey = TEST_WRITEKEY

// TODO what happens if we only have defaults?
const plan = {
  track: {
    'Track Event': {
      enabled: true,
      integrations: {
        'Braze Web Mode (Actions)': false,
      },
    },
    __default: {
      enabled: true,
      integrations: {},
    },
    hi: {
      enabled: true,
      integrations: {
        'Braze Web Mode (Actions)': false,
      },
    },
  },
  identify: {
    __default: {
      enabled: true,
    },
  },
  group: {
    __default: {
      enabled: true,
    },
  },
}

const settings: LegacySettings = {
  integrations: {
    'Braze Web Mode (Actions)': {},
    'Segment.io': {},
  },
  remotePlugins: [
    {
      name: 'Braze Web Mode (Actions)',
      libraryName: 'brazeDestination',
      url:
        'https://cdn.segment.com/next-integrations/actions/braze/9850d2cc8308a89db62a.js',
      settings: {
        subscriptions: [
          {
            partnerAction: 'trackEvent',
          },
          {
            partnerAction: 'updateUserProfile',
          },
          {
            partnerAction: 'trackPurchase',
          },
        ],
      },
    },
  ],
}

const trackEvent: Plugin = {
  name: 'Braze Web Mode (Actions) trackEvent',
  type: 'destination',
  version: '1.0',

  load(_ctx: Context): Promise<void> {
    return Promise.resolve()
  },

  isLoaded(): boolean {
    return true
  },

  track: async (ctx) => ctx,
  identify: async (ctx) => ctx,
  page: async (ctx) => ctx,
  group: async (ctx) => ctx,
  alias: async (ctx) => ctx,
}

const trackPurchase: Plugin = {
  ...trackEvent,
  name: 'Braze Web Mode (Actions) trackPurchase',
}

const updateUserProfile: Plugin = {
  ...trackEvent,
  name: 'Braze Web Mode (Actions) updateUserProfile',
}

describe('schema filter', () => {
  let options: SegmentioSettings
  let filterXt: Plugin
  let segment: Plugin
  let analytics: Analytics

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.restoreAllMocks()

    options = { apiKey: 'foo' }
    analytics = new Analytics({ writeKey: options.apiKey })
    segment = segmentio(analytics, options, {})
    filterXt = schemaFilter(plan.track, settings)
  })

  it('loads plugin', async () => {
    await analytics.register(filterXt)
    expect(filterXt.isLoaded()).toBe(true)
  })

  it('does not drop events when no plan is defined', async () => {
    jest.spyOn(segment, 'track')
    jest.spyOn(trackEvent, 'track')
    jest.spyOn(trackPurchase, 'track')
    jest.spyOn(updateUserProfile, 'track')
    // jest.spyOn(segment, 'track')

    await analytics.register(
      segment,
      trackEvent,
      trackPurchase,
      updateUserProfile
    )

    await analytics.register(schemaFilter({}, settings))

    const ev = await analytics.track('A Track Event')

    expect(segment.track).toHaveBeenCalled()
    expect(trackEvent.track).toHaveBeenCalledWith(ev)
    expect(trackPurchase.track).toHaveBeenCalled()
    expect(updateUserProfile.track).toHaveBeenCalled()
  })
})
