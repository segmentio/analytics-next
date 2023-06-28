/**
 * @example
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) => { a: 1, c: 3 }
 */
export const pick = <
  Obj extends Record<string, unknown>,
  Key extends keyof Obj
>(
  obj: Obj,
  keys: Key[]
): Pick<Obj, Key> => {
  return keys.reduce((acc, k) => {
    if (k in obj) {
      acc[k] = obj[k]
    }
    return acc
  }, {} as Pick<Obj, Key>)
}
