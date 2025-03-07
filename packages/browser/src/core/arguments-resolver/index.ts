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

const isNil = (val: any): val is null | undefined =>
  val === null || val === undefined

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

  if (typeof args[0] === 'string') {
    resolvedCategory = args[0]
  }
  if (typeof args[1] === 'string') {
    resolvedName = args[1]
  }

  // if there is just one string in the first two args, it's the name
  const strings = [args[0], args[1]].filter(isString)
  if (strings.length === 1) {
    resolvedCategory = null
    resolvedName = strings[0]
  }

  // if there is any function, it's always the callback
  const resolvedCallback = args.find(isFunction) as Callback | undefined

  args.forEach((obj, argIdx) => {
    if (isPlainObject(obj)) {
      if (argIdx === 0) {
        resolvedProperties = obj
      }
      if (argIdx === 1 || argIdx == 2) {
        if (isNil(resolvedProperties)) {
          resolvedProperties = obj
        } else {
          resolvedOptions = obj
        }
      }

      // if it's the third argument and it's an object, it's always properties
      if (argIdx === 3) {
        resolvedOptions = obj
      }
    }
  })

  // if there is an object and it's the fourth argument, it's options

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
