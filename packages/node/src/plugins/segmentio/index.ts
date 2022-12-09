import { CoreContext, CorePlugin } from '@segment/analytics-core'
import { Publisher, PublisherProps } from './publisher'
import { version } from '../../../package.json'
import { detectRuntime } from '../../lib/env'

function normalizeEvent(ctx: CoreContext) {
  ctx.updateEvent('context.library.name', 'AnalyticsNode')
  ctx.updateEvent('context.library.version', version)
  const runtime = detectRuntime()
  if (runtime === 'node') {
    ctx.updateEvent('_metadata.nodeVersion', process.versions.node)
  }
  ctx.updateEvent('_metadata.runtime', runtime)
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

export function createNodePlugin(publisher: Publisher): SegmentNodePlugin {
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

export const createConfiguredNodePlugin = (props: ConfigureNodePluginProps) => {
  const publisher = new Publisher(props)
  return {
    publisher: publisher,
    plugin: createNodePlugin(publisher),
  }
}
