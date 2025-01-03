export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => func(...args), wait)
  }
}

/**
 * Debounce with key-based partitioning, so that the debouncing is done per key group.
 * @param func The function to debounce
 * @param getKey A function that returns a key for the arguments passed to `func` -- the return type must be serializable
 */
export function debounceWithKey<Args extends any[]>(
  func: (...args: Args) => void,
  getKey: (...args: Args) => object | string,
  wait: number
): (...args: Args) => void {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  return (...args: Args) => {
    const key = getKey(...args)
    const keyGroup = typeof key === 'object' ? JSON.stringify(key) : key

    if (timers.has(keyGroup)) {
      clearTimeout(timers.get(keyGroup))
    }

    const timer = setTimeout(() => {
      timers.delete(keyGroup)
      func(...args)
    }, wait)

    timers.set(keyGroup, timer)
  }
}
