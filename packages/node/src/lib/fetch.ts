import { fetch as _fetch } from 'undici'

export const fetch = globalThis.fetch || _fetch
