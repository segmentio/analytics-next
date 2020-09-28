export function isOnline(): boolean {
  return window.navigator.onLine
}

export function isOffline(): boolean {
  return !isOnline()
}
