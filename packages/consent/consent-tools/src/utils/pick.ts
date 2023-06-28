/**
 * @example
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) => { a: 1, c: 3 }
 */
export const pick = <T extends Record<string, any>, K extends string>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  return keys.reduce((acc, k) => {
    if (k in obj) {
      ;(acc as any)[k] = obj[k]
    }
    return acc
  }, {} as T)
}
