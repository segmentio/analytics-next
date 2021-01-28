import { Analytics } from '../../analytics'
import { loadScript } from '../../lib/load-script'

export async function loadLegacyVideoPlugins(
  analytics: Analytics
): Promise<void> {
  await loadScript(
    'https://unpkg.com/@segment/analytics.js-video-plugins@0.2.1/dist/index.umd.js'
  )

  // This is super gross, but we need to support the `window.analytics.plugins` namespace
  // that is linked in the segment docs in order to be backwards compatible with ajs-classic

  // @ts-expect-error
  analytics.plugins = window.analyticsVideoPlugins
}
