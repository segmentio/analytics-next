import { isFunction, isPlainObject, isString } from '../validation/helpers'
import { JSONObject, EventProperties, CoreOptions } from '../events'
import { Callback } from '../events/interfaces'

/**
 * Helper for page, screen methods
 */
export function resolvePageArguments(
  category?: string | object,
  name?: string | object | Callback,
  properties?: EventProperties | CoreOptions | Callback | null,
  options?: CoreOptions | Callback,
  callback?: Callback
): [
  string | null,
  string | null,
  EventProperties,
  CoreOptions,
  Callback | undefined
] {
  let resolvedCategory: string | undefined | null = null
  let resolvedName: string | undefined | null = null
  const args = [category, name, properties, options, callback]

  const strings = args.filter(isString)
  if (strings[0] !== undefined && strings[1] !== undefined) {
    resolvedCategory = strings[0]
    resolvedName = strings[1]
  }

  if (strings.length === 1) {
    resolvedCategory = null
    resolvedName = strings[0]
  }

  const resolvedCallback = args.find(isFunction) as Callback | undefined

  const objects = args.filter((obj) => {
    if (resolvedName === null) {
      return isPlainObject(obj)
    }
    return isPlainObject(obj) || obj === null
  }) as Array<JSONObject | null>

  const resolvedProperties = (objects[0] ?? {}) as EventProperties
  const resolvedOptions = (objects[1] ?? {}) as CoreOptions

  return [
    resolvedCategory,
    resolvedName,
    resolvedProperties,
    resolvedOptions,
    resolvedCallback,
  ]
}

export type PageParams = Parameters<typeof resolvePageArguments>
