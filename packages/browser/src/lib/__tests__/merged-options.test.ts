import { cdnSettingsMinimal } from '../../test-helpers/fixtures'
import { mergedOptions } from '../merged-options'

describe(mergedOptions, () => {
  it('merges options', () => {
    const merged = mergedOptions(
      {
        ...cdnSettingsMinimal,
        integrations: {
          ...cdnSettingsMinimal.integrations,
          CustomerIO: {},
          Amplitude: {
            apiKey: '🍌',
          },
        },
      },
      {
        integrations: {
          CustomerIO: {
            ghost: '👻',
          },
        },
      }
    )

    expect(merged).toMatchInlineSnapshot(`
      {
        "Amplitude": {
          "apiKey": "🍌",
        },
        "CustomerIO": {
          "ghost": "👻",
        },
        "Fake": {},
        "Segment.io": {
          "apiKey": "my-writekey",
        },
      }
    `)
  })

  it('ignores options for integrations that arent returned by CDN', () => {
    const merged = mergedOptions(
      {
        ...cdnSettingsMinimal,
        integrations: {
          ...cdnSettingsMinimal.integrations,
          Amplitude: {
            apiKey: '🍌',
          },
        },
      },
      {
        integrations: {
          // not in CDN
          CustomerIO: {
            ghost: '👻',
          },
        },
      }
    )

    expect(merged).toMatchInlineSnapshot(`
      {
        "Amplitude": {
          "apiKey": "🍌",
        },
        "Fake": {},
        "Segment.io": {
          "apiKey": "my-writekey",
        },
      }
    `)
  })

  it('does not attempt to merge non objects', () => {
    const merged = mergedOptions(
      {
        ...cdnSettingsMinimal,
        integrations: {
          ...cdnSettingsMinimal.integrations,
          CustomerIO: {
            ghost: '👻',
          },
          Amplitude: {
            apiKey: '🍌',
          },
        },
      },
      {
        integrations: {
          // disabling customerIO as an integration override
          CustomerIO: false,
        },
      }
    )

    expect(merged).toMatchInlineSnapshot(`
      {
        "Amplitude": {
          "apiKey": "🍌",
        },
        "CustomerIO": {
          "ghost": "👻",
        },
        "Fake": {},
        "Segment.io": {
          "apiKey": "my-writekey",
        },
      }
    `)
  })

  it('works with boolean overrides', () => {
    const cdn = {
      ...cdnSettingsMinimal,
      integrations: {
        ...cdnSettingsMinimal.integrations,
        'Segment.io': { apiHost: 'api.segment.io', apiKey: 'foo' },
        'Google Tag Manager': {
          ghost: '👻',
        },
      },
    }
    const overrides = {
      integrations: {
        All: false,
        'Segment.io': { apiHost: 'mgs.instacart.com/v2' },
        'Google Tag Manager': true,
      },
    }

    expect(mergedOptions(cdn, overrides)).toMatchInlineSnapshot(`
      {
        "Fake": {},
        "Google Tag Manager": {
          "ghost": "👻",
        },
        "Segment.io": {
          "apiHost": "mgs.instacart.com/v2",
          "apiKey": "foo",
        },
      }
    `)
  })
})
