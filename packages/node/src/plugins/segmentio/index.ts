import { CoreContext, CorePlugin } from '@segment/analytics-core'
import { Publisher, PublisherProps } from './publisher'
import { version } from '../../../package.json'

function normalizeEvent(ctx: CoreContext) {
  ctx.updateEvent('context.library.name', 'AnalyticsNode')
  ctx.updateEvent('context.library.version', version)
  ctx.updateEvent('_metadata.nodeVersion', process.versions.node)
}

type DefinedPluginFields =
  | 'name'
  | 'type'
  | 'version'
  | 'isLoaded'
  | 'load'
  | 'alias'
  | 'group'
  | 'identify'
  | 'page'
  | 'screen'
  | 'track'

type SegmentNodePlugin = CorePlugin &
  Required<Pick<CorePlugin, DefinedPluginFields>>

export type ConfigureNodePluginProps = PublisherProps

export function configureNodePlugin(
  props: ConfigureNodePluginProps
): SegmentNodePlugin {
  const publisher = new Publisher(props)

  function action(ctx: CoreContext): Promise<CoreContext> {
    normalizeEvent(ctx)
    return publisher.enqueue(ctx)
  }

  return {
    name: 'Segment.io',
    type: 'after',
    version: '1.0.0',
    isLoaded: () => true,
    load: () => Promise.resolve(),
    alias: action,
    group: action,
    identify: action,
    page: action,
    screen: action,
    track: action,
  }
}
