import type { HTTPFetchFn } from './http-client'

export const fetch: HTTPFetchFn = (...args) => {
  return globalThis.fetch(...args)
}
