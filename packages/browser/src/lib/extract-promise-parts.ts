/**
 * Returns a promise and its associated `resolve` and `reject` methods.
 */
export function extractPromiseParts<T = unknown>(): {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
} {
  let resolver: (value: T) => void
  let rejecter: (reason?: unknown) => void
  const promise = new Promise<T>((resolve, reject) => {
    resolver = resolve
    rejecter = reject
  })

  return {
    promise,
    resolve: resolver!,
    reject: rejecter!,
  }
}
