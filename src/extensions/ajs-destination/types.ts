import { Alias } from '@segment/facade/dist/alias'
import { Group } from '@segment/facade/dist/group'
import { Identify } from '@segment/facade/dist/identify'
import { Page } from '@segment/facade/dist/page'
import { Track } from '@segment/facade/dist/track'
import { Analytics } from '../../analytics'
import { Emitter } from '../../core/emitter'

export interface LegacyIntegration extends Emitter {
  analytics?: Analytics
  initialize: () => void
  loaded: () => boolean

  track?: (event: typeof Track) => void | Promise<void>
  identify?: (event: typeof Identify) => void | Promise<void>
  page?: (event: typeof Page) => void | Promise<void>
  alias?: (event: typeof Alias) => void | Promise<void>
  group?: (event: typeof Group) => void | Promise<void>

  // Segment.io specific
  ontrack?: (event: typeof Track) => void | Promise<void>
  onidentify?: (event: typeof Identify) => void | Promise<void>
  onpage?: (event: typeof Page) => void | Promise<void>
  onalias?: (event: typeof Alias) => void | Promise<void>
  ongroup?: (event: typeof Group) => void | Promise<void>
}
