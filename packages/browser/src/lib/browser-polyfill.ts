export function shouldPolyfill(): boolean {
  const browserVersionCompatList: { [browser: string]: number } = {
    Firefox: 46,
    Edge: 13,
    Opera: 50,
  }

  const isOperaMiniExtremeMode = (window as any).operamini // compression proxy - allows for page() calls.

  // Unfortunately IE doesn't follow the same pattern as other browsers, so we
  // need to check `isIE11` differently.
  // @ts-expect-error
  const isIE11 = !!window.MSInputMethodContext && !!document.documentMode

  const userAgent = navigator.userAgent.split(' ')
  const [browser, version] = userAgent[userAgent.length - 1].split('/')

  return (
    isIE11 ||
    isOperaMiniExtremeMode ||
    (browserVersionCompatList[browser] !== undefined &&
      browserVersionCompatList[browser] >= parseInt(version))
  )
}
