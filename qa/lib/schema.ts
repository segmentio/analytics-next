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

export const objectSchema = (obj: object | string) => {
  let parsed = obj
  if (typeof obj === 'string') {
    parsed = JSON.parse(obj)
  }

  return Object.keys(flat(parsed))
}

expect.extend({
  toContainSchema(got: object, expected: object) {
    const gotSchema = objectSchema(got).sort()
    const expectedSchema = objectSchema(expected).sort()
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
