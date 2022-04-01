import { difference } from 'lodash'
import { JSONValue } from '../../src/core/events'
import flat from 'flat'

declare global {
  namespace jest {
    interface Matchers<R> {
      toContainSchema(got: JSONValue): CustomMatcherResult
    }
  }
}

function injectAncestorKeys(keys: string[]): string[] {
  const allKeys = new Set(keys)
  for (const key of keys) {
    const parts = key.split('.')
    if (parts.length === 1) continue

    do {
      // remove the last item from the parts
      parts.pop()
      const newKey = parts.join('.')
      if (newKey) {
        allKeys.add(newKey)
      }
    } while (parts.length)
  }

  return Array.from(allKeys)
}

export const objectSchema = (obj: object | string) => {
  let parsed = obj
  if (typeof obj === 'string') {
    parsed = JSON.parse(obj)
  }

  const flattenedKeys = Object.keys(flat(parsed))
  const allKeys = injectAncestorKeys(flattenedKeys)

  return allKeys.sort()
}

expect.extend({
  toContainSchema(got: object, expected: object) {
    const gotSchema = objectSchema(got)
    const expectedSchema = objectSchema(expected)
    const missing = difference(expectedSchema, gotSchema)

    const message = () =>
      'Incompatible schema. Missing the following properties: \n ' +
      missing.join('\n')

    return {
      pass: missing.length === 0,
      message,
    }
  },
})
