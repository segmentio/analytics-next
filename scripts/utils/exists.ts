/**
 * This type guard can be passed into a function such as native filter
 * in order to remove nullish values from a list in a type-safe way.
 */
export const exists = <T>(value: T): value is NonNullable<T> => {
  return value != null && value !== undefined
}
