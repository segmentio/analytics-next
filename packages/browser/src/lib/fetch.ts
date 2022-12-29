import unfetch from 'unfetch'
import { getGlobal } from './get-global'

/**
 * Wrapper around native `fetch` containing `unfetch` fallback.
 */
export const fetch: typeof unfetch = (...args) => {
  const global = getGlobal()
  let fetch = unfetch

  if (global && global.fetch) {
    fetch = global.fetch
  }
  return fetch(...args)
}
