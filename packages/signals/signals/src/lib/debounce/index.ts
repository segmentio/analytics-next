// Debounce function
export const debounce = <Fn extends (...args: any[]) => any>(
  fn: Fn,
  delay: number
): Fn => {
  let timeoutId: ReturnType<typeof setTimeout>
  const debounced = (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
  return debounced as Fn
}
