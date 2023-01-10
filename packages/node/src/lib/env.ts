export type RuntimeEnv =
  | 'node'
  | 'browser'
  | 'web-worker'
  | 'cloudflare-worker'
  | 'unknown'

export const detectRuntime = (): RuntimeEnv => {
  if (typeof process === 'object' && process && process.env) {
    return 'node'
  }

  if (typeof window === 'object') {
    return 'browser'
  }

  // @ts-ignore
  if (typeof WebSocketPair !== 'undefined') {
    return 'cloudflare-worker'
  }

  if (
    // @ts-ignore
    typeof WorkerGlobalScope !== 'undefined' &&
    // @ts-ignore
    typeof importScripts === 'function'
  ) {
    return 'web-worker'
  }

  return 'unknown'
}
