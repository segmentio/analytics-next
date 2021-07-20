export function getCDN(): string {
  let cdn: string | undefined = undefined

  const regex = /(https:\/\/.*)\/analytics\.js\/v1\/(?:.*?)\/(?:platform|analytics.*)?/
  const scripts = Array.from(document.querySelectorAll('script'))

  scripts.forEach((s) => {
    const src = s.getAttribute('src') ?? ''
    const result = regex.exec(src)

    if (result && result[1]) {
      cdn = result[1]
    }
  })

  // it's possible that the CDN is not found in the page because:
  // - the script is loaded through a proxy
  // - the script is removed after execution
  // in this case, we fall back to the default Segment CDN
  if (!cdn) {
    return `https://cdn.segment.com`
  }

  return cdn
}
