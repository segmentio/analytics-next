/**
 * Remove Index Signature
 */
export type RemoveIndexSignature<T> = {
  [K in keyof T as {} extends Record<K, 1> ? never : K]: T[K]
}
