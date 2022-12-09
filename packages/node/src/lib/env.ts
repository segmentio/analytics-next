export type RuntimeEnv = 'node' | 'browser' | 'web-worker' | 'unknown'

export const detectRuntime = (): RuntimeEnv => {
  if (typeof process?.env === 'object') {
    return 'node'
  }

  if (typeof window === 'object') {
    return 'browser'
  }

  if (
    // @ts-ignore
    typeof WorkerGlobalScope !== 'undefined' && // this may sometimes be available in a CF worker, so check for importScripts
    // @ts-ignore
    typeof importScripts === 'function'
  ) {
    return 'web-worker'
  }

  return 'unknown'
}
