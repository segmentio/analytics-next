import {
  isFunction,
  isPlainObject,
  isString,
  isNumber,
} from '@segment/analytics-core'
import { Context } from '../context'
import {
  Callback,
  Options,
  EventProperties,
  SegmentEvent,
  Traits,
  GroupTraits,
  UserTraits,
} from '../events'
import { ID, WithId } from '../user'

/**
 * Helper for the track method
 */
export function resolveArguments(
  eventName: string | SegmentEvent,
  properties?: EventProperties | Callback,
  options?: Options | Callback,
  callback?: Callback
): [string, EventProperties | Callback, Options, Callback | undefined] {
  const args = [eventName, properties, options, callback]

  const name = isPlainObject(eventName) ? eventName.event : eventName
  if (!name || !isString(name)) {
    throw new Error('Event missing')
  }

  const data = isPlainObject(eventName)
    ? eventName.properties ?? {}
    : isPlainObject(properties)
    ? properties
    : {}

  let opts: Options = {}
  if (!isFunction(options)) {
    opts = options ?? {}
  }

  if (isPlainObject(eventName) && !isFunction(properties)) {
    opts = properties ?? {}
  }

  const cb = args.find(isFunction) as Callback | undefined
  return [name, data, opts, cb]
}

/**
 * Helper for page, screen methods
 */
export function resolvePageArguments(
  category?: string | object | null,
  name?: string | object | Callback | null,
  properties?: EventProperties | Options | Callback | null,
  options?: Options | Callback,
  callback?: Callback
): [
  string | null,
  string | null,
  EventProperties,
  Options,
  Callback | undefined
] {
  let resolvedProperties: EventProperties
  let resolvedOptions: Options
  let resolvedCategory: string | undefined | null = null
  let resolvedName: string | undefined | null = null
  const args = [category, name, properties, options, callback]

  // The legacy logic is basically:
  // - If there is a string, it's the name
  // - If there are two strings, it's category and name
  const strings = args.filter(isString)
  if (strings.length === 1) {
    if (isString(args[1])) {
      resolvedName = args[1]
      resolvedCategory = null
    } else {
      resolvedName = strings[0]
      resolvedCategory = null
    }
  } else if (strings.length === 2) {
    if (typeof args[0] === 'string') {
      resolvedCategory = args[0]
    }
    if (typeof args[1] === 'string') {
      resolvedName = args[1]
    }
  }

  // handle: analytics.page('category', 'name', properties, options, callback)
  const resolvedCallback = args.find(isFunction) as Callback | undefined

  // handle:
  // - analytics.page('name')
  // - analytics.page('category', 'name')
  // - analytics.page(properties)
  // - analytics.page(properties, options)
  // - analytics.page('name', properties)
  // - analytics.page('name', properties, options)
  // - analytics.page('category', 'name', properties, options)
  // - analytics.page('category', 'name', properties, options, callback)
  // - analytics.page('category', 'name', callback)
  // - analytics.page(callback), etc

  // The legacy logic is basically:
  // - If there is a plain object, it's the properties
  // - If there are two plain objects, it's properties and options
  const objects = args.filter(isPlainObject)
  if (objects.length === 1) {
    if (isPlainObject(args[2])) {
      resolvedOptions = {}
      resolvedProperties = args[2]
    } else if (isPlainObject(args[3])) {
      resolvedProperties = {}
      resolvedOptions = args[3]
    } else {
      resolvedProperties = objects[0]
      resolvedOptions = {}
    }
  } else if (objects.length === 2) {
    resolvedProperties = objects[0]
    resolvedOptions = objects[1]
  }

  return [
    resolvedCategory,
    resolvedName,
    (resolvedProperties ??= {}),
    (resolvedOptions ??= {}),
    resolvedCallback,
  ]
}

/**
 * Helper for group, identify methods
 */
export const resolveUserArguments = <T extends Traits, U extends WithId>(
  user: U
): ResolveUser<T> => {
  return (...args): ReturnType<ResolveUser<T>> => {
    const values: {
      id?: ID
      traits?: T | null
      options?: Options
      callback?: Callback
    } = {}
    // It's a stack so it's reversed so that we go through each of the expected arguments
    const orderStack: Array<keyof typeof values> = [
      'callback',
      'options',
      'traits',
      'id',
    ]

    // Read each argument and eval the possible values here
    for (const arg of args) {
      let current = orderStack.pop()
      if (current === 'id') {
        if (isString(arg) || isNumber(arg)) {
          values.id = arg.toString()
          continue
        }
        if (arg === null || arg === undefined) {
          continue
        }
        // First argument should always be the id, if it is not a valid value we can skip it
        current = orderStack.pop()
      }

      // Traits and Options
      if (
        (current === 'traits' || current === 'options') &&
        (arg === null || arg === undefined || isPlainObject(arg))
      ) {
        values[current] = arg as T
      }

      // Callback
      if (isFunction(arg)) {
        values.callback = arg as Callback
        break // This is always the last argument
      }
    }

    return [
      values.id ?? user.id(),
      (values.traits ?? {}) as T,
      values.options ?? {},
      values.callback,
    ]
  }
}

/**
 * Helper for alias method
 */
export function resolveAliasArguments(
  to: string | number,
  from?: string | number | Options,
  options?: Options | Callback,
  callback?: Callback
): [string, string | null, Options, Callback | undefined] {
  if (isNumber(to)) to = to.toString() // Legacy behaviour - allow integers for alias calls
  if (isNumber(from)) from = from.toString()
  const args = [to, from, options, callback]

  const [aliasTo = to, aliasFrom = null] = args.filter(isString)
  const [opts = {}] = args.filter(isPlainObject)
  const resolvedCallback = args.find(isFunction) as Callback | undefined

  return [aliasTo, aliasFrom, opts, resolvedCallback]
}

type ResolveUser<T extends Traits> = (
  id?: ID | object,
  traits?: T | Callback | null,
  options?: Options | Callback,
  callback?: Callback
) => [ID, T, Options, Callback | undefined]

export type IdentifyParams = Parameters<ResolveUser<UserTraits>>
export type GroupParams = Parameters<ResolveUser<GroupTraits>>
export type EventParams = Parameters<typeof resolveArguments>
export type PageParams = Parameters<typeof resolvePageArguments>
export type AliasParams = Parameters<typeof resolveAliasArguments>

export type DispatchedEvent = Context
