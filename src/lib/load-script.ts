/* eslint-disable @typescript-eslint/ban-ts-ignore */
export function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = window.document.createElement('script')
    let r = false
    s.type = 'text/javascript'
    s.src = src
    s.async = true
    s.onerror = (err): void => {
      reject(err)
    }

    // @ts-ignore
    s.onload = s.onreadystatechange = function (): void {
      // @ts-ignore
      if (!r && (!this.readyState || this.readyState == 'complete')) {
        r = true
        resolve()
      }
    }
    const t = window.document.getElementsByTagName('script')[0]
    t.parentElement?.insertBefore(s, t)
  })
}
