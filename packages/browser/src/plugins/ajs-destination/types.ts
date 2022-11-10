import { Group, Identify, Track, Page, Alias } from '@segment/facade'
import { Analytics } from '../../core/analytics'
import { Emitter } from '@segment/analytics-core'
import { User } from '../../core/user'

export interface LegacyIntegration extends Emitter {
  name: string
  analytics?: Analytics
  initialize: () => void
  loaded: () => boolean

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invoke: (method: string, ...args: any[]) => unknown

  track?: (event: Track) => void | Promise<void>
  identify?: (event: Identify) => void | Promise<void>
  page?: (event: Page) => void | Promise<void>
  alias?: (event: Alias) => void | Promise<void>
  group?: (event: Group) => void | Promise<void>

  // Segment.io specific
  ontrack?: (event: Track) => void | Promise<void>
  onidentify?: (event: Identify) => void | Promise<void>
  onpage?: (event: Page) => void | Promise<void>
  onalias?: (event: Alias) => void | Promise<void>
  ongroup?: (event: Group) => void | Promise<void>

  _assumesPageview?: boolean
  options?: object
}

export interface LegacyIntegrationBuilder {
  new (options: object): LegacyIntegration
  prototype: LegacyIntegration
}

export interface LegacyIntegrationGenerator {
  (analytics: { user: () => User; addIntegration: () => void }): void
  Integration: LegacyIntegrationBuilder
}

export type LegacyIntegrationSource =
  | LegacyIntegrationGenerator
  | LegacyIntegrationBuilder
