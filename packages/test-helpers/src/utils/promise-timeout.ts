export function promiseTimeout(
  promise: Promise<void>,
  timeout: number,
  errorMsg?: string
) {
  let timeoutId: ReturnType<typeof setTimeout>
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMsg ?? 'Promise timed out'))
    }, timeout)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId)
  })
}
