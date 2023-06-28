/**
 * @example
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']) => { a: 1, c: 3 }
 */
export const pick = <Obj extends Record<Key, unknown>, Key extends string>(
  obj: Obj,
  keys: Key[]
): Pick<Obj, Key> => {
  return keys.reduce((acc, k) => {
    if (k in obj) {
      ;(acc as any)[k] = obj[k]
    }
    return acc
  }, {} as Obj)
}
