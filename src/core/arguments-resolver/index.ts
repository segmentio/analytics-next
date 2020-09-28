import { isFunction, isPlainObject, isString } from '../../extensions/validation'
import { Context } from '../context'
import { SegmentEvent } from '../events'
import { ID, User } from '../user'

export type Callback = (ctx: Context | undefined) => Promise<unknown> | unknown

export function resolveArguments(
  eventName: string | SegmentEvent,
  properties?: object | Callback,
  options?: object | Callback,
  callback?: Callback
): [string, object, object, Callback | undefined] {
  const name = isPlainObject(eventName) ? eventName.event : eventName
  if (!name || !isString(name)) {
    throw new Error('Event missing')
  }
  const data = isPlainObject(eventName) ? eventName : isPlainObject(properties) ? properties : {}
  const opts = isPlainObject(options) ? options : {}
  const cb = isFunction(properties) ? properties : isFunction(options) ? options : callback

  return [name, data, opts, cb]
}

export const resolveUserArguments = (user: User): ResolveUser => {
  return (...args): ReturnType<ResolveUser> => {
    const [id, traits, options, callback] = args

    const resolvedId = isPlainObject(id) ? user.id() : id

    const data = isPlainObject(id) ? id : isPlainObject(traits) ? traits : {}
    const opts = isPlainObject(id) ? (isPlainObject(traits) ? traits : options ?? {}) : {}
    const cb = isFunction(traits) ? traits : isFunction(options) ? options : callback

    return [resolvedId, data, opts, cb]
  }
}

type ResolveUser = (
  id: ID | object,
  traits?: object | Callback,
  options?: object | Callback,
  callback?: Callback
) => [ID, object, object, Callback | undefined]

export type UserParams = Parameters<ResolveUser>
export type EventParams = Parameters<typeof resolveArguments>

export type DispatchedEvent = Promise<Context | undefined>
