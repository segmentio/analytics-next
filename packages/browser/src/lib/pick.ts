/**
 * @example
 * pick({ 'a': 1, 'b': '2', 'c': 3 }, ['a', 'c'])
 * => { 'a': 1, 'c': 3 }
 */
export const pick = <T, K extends keyof T>(
  object: T,
  keys: readonly K[]
): Pick<T, K> =>
  Object.assign(
    {},
    ...keys.map((key) => {
      if (object && Object.prototype.hasOwnProperty.call(object, key)) {
        return { [key]: object[key] }
      }
    })
  )
