import { default as _fetch } from 'node-fetch'

export const fetch = globalThis.fetch || _fetch
