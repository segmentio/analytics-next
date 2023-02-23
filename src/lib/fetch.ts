import unfetch from 'unfetch'
import { getGlobal } from './get-global'

/**
 * Wrapper around native `fetch` containing `unfetch` fallback.
 */
// @ts-ignore
export const fetch: typeof global.fetch = (...args) => {
  const global = getGlobal()
  // @ts-ignore
  return ((global && global.fetch) || unfetch)(...args)
}
