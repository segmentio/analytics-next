export interface RuntimeEnv {
  type: 'node' | 'browser' | 'web-worker' | 'unknown'
  version?: string
}

export const detectRuntime = (): RuntimeEnv => {
  if (typeof process?.env === 'object') {
    return { type: 'node', version: process.versions?.node || 'unknown' }
  }

  if (typeof window === 'object') {
    return { type: 'browser' }
  }

  if (
    // @ts-ignore
    typeof WorkerGlobalScope !== 'undefined' && // this may sometimes be available in a CF worker, so check for importScripts
    // @ts-ignore
    typeof importScripts === 'function'
  ) {
    return { type: 'web-worker' }
  }

  return { type: 'unknown' }
}
