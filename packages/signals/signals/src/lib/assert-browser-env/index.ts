export const assertBrowserEnv = () => {
  if (typeof window === 'undefined') {
    throw new Error('This can only be run in a browser environment.')
  }
}
