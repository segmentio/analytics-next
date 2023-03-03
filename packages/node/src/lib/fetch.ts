export const fetch: typeof globalThis.fetch = async (...args) => {
  if (globalThis.fetch) {
    return globalThis.fetch(...args)
  } // @ts-ignore
  // This guard causes is important, as it causes dead-code elimination to be enabled inside this block.
  else if (typeof EdgeRuntime !== 'string') {
    // @ts-ignore
    return (await import('node-fetch')).default(...args) as Response
  } else {
    throw new Error(
      'Invariant: an edge runtime that does not support fetch should not exist'
    )
  }
}
