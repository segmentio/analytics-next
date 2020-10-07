import { isFunction, isPlainObject, isString } from '../../extensions/validation'
import { Context } from '../context'
import { Options, SegmentEvent } from '../events'
import { ID, User } from '../user'

export type Callback = (ctx: Context | undefined) => Promise<unknown> | unknown

export function resolveArguments(
  eventName: string | SegmentEvent,
  properties?: object | Callback,
  options?: Options | Callback,
  callback?: Callback
): [string, object, Options, Callback | undefined] {
  const args = [eventName, properties, options, callback]

  const name = isPlainObject(eventName) ? eventName.event : eventName
  if (!name || !isString(name)) {
    throw new Error('Event missing')
  }

  const data = isPlainObject(eventName) ? eventName.properties ?? {} : isPlainObject(properties) ? properties : {}

  let opts = {}
  if (isPlainObject(properties) && !isFunction(options)) {
    opts = options ?? {}
  }

  if (isPlainObject(eventName) && !isFunction(properties)) {
    opts = properties ?? {}
  }

  const cb = args.find(isFunction) as Callback | undefined
  return [name, data, opts, cb]
}

export function resolvePageArguments(
  category?: string | object,
  name?: string | object | Callback,
  properties?: object | Options | Callback,
  options?: Options | Callback,
  callback?: Callback
): [string | null, string | null, object, Options, Callback | undefined] {
  let resolvedCategory: string | undefined | null = null
  let resolvedName: string | undefined | null = null

  const args = [category, name, properties, options, callback]

  const strings = args.filter(isString)
  if (strings[0] && strings[1]) {
    resolvedCategory = strings[0]
    resolvedName = strings[1]
  }

  if (strings.length === 1) {
    resolvedCategory = null
    resolvedName = strings[0]
  }

  const resolvedCallback = args.find(isFunction) as Callback | undefined
  const objects = args.filter(isPlainObject)

  const resolvedProperties = objects[0] ?? {}
  const resolvedOptions = objects[1] ?? {}

  return [resolvedCategory, resolvedName, resolvedProperties, resolvedOptions, resolvedCallback]
}

export const resolveUserArguments = (user: User): ResolveUser => {
  return (...args): ReturnType<ResolveUser> => {
    const id = args.find(isString) ?? user.id()
    const [data = {}, opts = {}] = args.filter(isPlainObject)
    const resolvedCallback = args.find(isFunction) as Callback | undefined

    return [id, data, opts, resolvedCallback]
  }
}

type ResolveUser = (
  id: ID | object,
  traits?: object | Callback,
  options?: Options | Callback,
  callback?: Callback
) => [ID, object, Options, Callback | undefined]

export type UserParams = Parameters<ResolveUser>
export type EventParams = Parameters<typeof resolveArguments>
export type PageParams = Parameters<typeof resolvePageArguments>

export type DispatchedEvent = Promise<Context>
