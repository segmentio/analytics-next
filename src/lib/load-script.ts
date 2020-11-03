/* eslint-disable @typescript-eslint/ban-ts-ignore */
type ResolveFn = (value?: void | PromiseLike<void> | undefined) => void
const loadedScripts: Record<string, 'not-loaded' | 'loaded' | 'loading'> = {}
const consumers: Record<string, ResolveFn[]> = {}

export function loadScript(src: string): Promise<void> {
  if (loadedScripts[src] === 'loaded') {
    return Promise.resolve()
  }

  if (loadedScripts[src] === 'loading') {
    const scriptConsumers = consumers[src] ?? []

    return new Promise((resolve) => {
      scriptConsumers.push(resolve)
      consumers[src] = scriptConsumers
    })
  }

  return new Promise((resolve, reject) => {
    let ready = false

    const script = window.document.createElement('script')
    script.type = 'text/javascript'
    script.src = src
    script.async = true
    script.onerror = (err): void => {
      reject(err)
    }

    loadedScripts[src] = 'loading'

    // @ts-ignore
    script.onload = script.onreadystatechange = function (): void {
      // @ts-ignore
      if (!ready && (!this.readyState || this.readyState == 'complete')) {
        loadedScripts[src] = 'loaded'
        ready = true

        resolve()
        ;(consumers[src] ?? []).forEach((consumer) => {
          consumer()
        })

        consumers[src] = []
      }
    }

    const tag = window.document.getElementsByTagName('script')[0]
    tag.parentElement?.insertBefore(script, tag)
  })
}
