/* eslint-disable @typescript-eslint/ban-ts-ignore */
export function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let ready = false

    const script = window.document.createElement('script')
    script.type = 'text/javascript'
    script.src = src
    script.async = true
    script.onerror = (err): void => {
      reject(err)
    }

    // @ts-ignore
    script.onload = script.onreadystatechange = function (): void {
      // @ts-ignore
      if (!ready && (!this.readyState || this.readyState == 'complete')) {
        ready = true
        resolve()
      }
    }

    const tag = window.document.getElementsByTagName('script')[0]
    tag.parentElement?.insertBefore(script, tag)
  })
}
