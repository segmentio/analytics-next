/**
 * Return a promise that can be externally resolved
 */
export const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason: any) => void
  let settled = false
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })

  // we "fork" the original promise instead of directly attatching `finally` to
  // it as it interferes with natural flow of then and catch in the user code
  Promise.allSettled([promise]).then(() => (settled = true), void 0)

  return {
    resolve,
    reject,
    promise,
    isSettled: () => settled,
  }
}
