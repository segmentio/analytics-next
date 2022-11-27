import { CoreContext } from '../context'

export interface EmittedError<Ctx extends CoreContext> {
  code: string
  reason?: unknown
  ctx?: Ctx
}

/**
 * Discriminated of all errors with a discriminant key of "code"
 */
export type CoreEmitterContract<
  Ctx extends CoreContext,
  Err extends EmittedError<Ctx> = EmittedError<Ctx>
> = {
  alias: [ctx: Ctx]
  track: [ctx: Ctx]
  identify: [ctx: Ctx]
  page: [ctx: Ctx]
  screen: [ctx: Ctx]
  group: [ctx: Ctx]
  register: [pluginNames: string[]]
  deregister: [pluginNames: string[]]
  error: [Err]
}
