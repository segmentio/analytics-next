export function loadScript(
  src: string,
  attributes?: Record<string, string>
): Promise<HTMLScriptElement> {
  const scripts = Array.from(window.document.querySelectorAll('script'))
  const found = scripts.find((s) => s.src === src)

  if (found !== undefined) {
    const status = found?.getAttribute('status')

    if (status === 'loaded') {
      return Promise.resolve(found)
    }

    if (status === 'loading') {
      return new Promise((resolve, reject) => {
        found.addEventListener('load', () => resolve(found))
        found.addEventListener('error', (err) => reject(err))
      })
    }
  }

  return new Promise((resolve, reject) => {
    const script = global.window.document.createElement('script')

    script.type = 'text/javascript'
    script.src = src
    script.async = true

    script.setAttribute('status', 'loading')
    for (const [k, v] of Object.entries(attributes ?? {})) {
      script.setAttribute(k, v)
    }

    script.onload = (): void => {
      script.onerror = script.onload = null
      script.setAttribute('status', 'loaded')
      resolve(script)
    }

    script.onerror = (): void => {
      script.onerror = script.onload = null
      script.setAttribute('status', 'error')
      reject(new Error(`Failed to load ${src}`))
    }

    const tag = global.window.document.getElementsByTagName('script')[0]
    tag.parentElement?.insertBefore(script, tag)
  })
}
