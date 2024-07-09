export function replaceBaseUrl(url: string, newBase: string) {
  const regex = /^(https?:\/\/)?([^/]+)(\/.*)?$/
  if (!/^https?:\/\//.test(newBase)) {
    newBase = 'https://' + newBase
  }

  return url.replace(regex, (_match, _protocol, _domain, path) => {
    return `${newBase}${path || ''}`
  })
}
