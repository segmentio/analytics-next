export function getCDN(): string | undefined {
  let regex: RegExp
  let cdn: string | undefined = undefined

  if (document.currentScript) {
    regex = /^(https?:\/\/)?[^#?/]+/

    const script = document.currentScript as HTMLScriptElement
    const src = script.src

    if (src.includes('localhost:')) return undefined // Hack - make sure we're not loading from localhost so we can properly load settings for testing/dev

    const result = regex.exec(src)

    if (result) {
      return result[0]
    }
  }

  regex = /(https:\/\/.*)\/analytics\.js\/v1\/(?:.*?)\/(?:platform|analytics.*)?/
  const scripts = Array.from(document.querySelectorAll('script'))
  scripts.forEach((s) => {
    const src = s.getAttribute('src') ?? ''
    const result = regex.exec(src)

    if (result && result[1]) {
      cdn = result[1]
    }
  })

  return cdn
}
