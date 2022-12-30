import unfetch from 'unfetch'
import { getGlobal } from './get-global'

/**
 * Wrapper around native `fetch` containing `unfetch` fallback.
 */
export const fetch: typeof unfetch = (...args) => {
  const global = getGlobal()
  const fn = (global && global.fetch) || unfetch
  return fn(...args)
}
