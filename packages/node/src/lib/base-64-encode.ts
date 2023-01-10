/**
 * Base64 encoder that works in browser, worker, node runtimes.
 */
export const b64encode = (str: string): string => {
  if (
    // in node env
    typeof Buffer !== 'undefined'
  ) {
    return Buffer.from(str).toString('base64')
  } else {
    // in worker env
    return btoa(str)
  }
}
