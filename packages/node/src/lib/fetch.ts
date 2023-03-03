export const fetch: typeof globalThis.fetch = async (...args) => {
  if (globalThis.fetch) {
    return globalThis.fetch(...args)
  }
  // @ts-ignore
  // this is an old version of node
  // This guard causes is important, as it causes dead-code elimination to be enabled inside this block.
  else if (typeof EdgeRuntime !== 'string') {
    // @ts-ignore
    return (await import('node-fetch')).default(...args) as Response
  } else {
    console.error('No runtime found.')
    throw new Error('No fetch found!')
  }
}
