export function promiseTimeout<T>(
  promise: Promise<T>,
  timeout: number,
  errorMsg?: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(Error(errorMsg ?? 'Promise timed out'))
    }, timeout)

    promise
      .then((val) => {
        clearTimeout(timeoutId)
        return resolve(val)
      })
      .catch(reject)
  })
}
