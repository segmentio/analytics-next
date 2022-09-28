import { CoreContext } from '../context'

export type EmittedUnknownError<Ctx extends CoreContext> = {
  code: 'unknown'
  message: string
  ctx?: Ctx
  err?: any
}

export type EmittedDeliveryFailureError<Ctx extends CoreContext> = {
  code: 'delivery_failure'
  message: string
  ctx: Ctx
}

/**
 * Discriminated of all errors with a discriminant key of "code"
 */
export type CoreEmittedError<Ctx extends CoreContext> =
  | EmittedUnknownError<Ctx>
  | EmittedDeliveryFailureError<Ctx>

export type CoreEmitterContract<
  Ctx extends CoreContext,
  AdditionalErrors = CoreEmittedError<Ctx>
> = {
  alias: [ctx: Ctx]
  track: [ctx: Ctx]
  identify: [ctx: Ctx]
  page: [ctx: Ctx]
  screen: [ctx: Ctx]
  group: [ctx: Ctx]
  register: [pluginNames: string[]]
  deregister: [pluginNames: string[]]
  error: [CoreEmittedError<Ctx> | AdditionalErrors]
}
