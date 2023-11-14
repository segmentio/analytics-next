/**
 * A utility type that makes a specified set of fields optional in a given type.
 * @template T - The type to make fields optional in.
 * @template K - The keys of the fields to make optional.
 * @example
 * type MyType = {
 *  a: string
 *  b: number
 * }
 * type MyTypeWithOptionalA = OptionalField<MyType, 'a'>
 * // MyTypeWithOptionalA is equivalent to:
 * type MyTypeWithOptionalA = {
 *   a?: string
 *   b: number
 *  }
 */
export type OptionalField<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>
