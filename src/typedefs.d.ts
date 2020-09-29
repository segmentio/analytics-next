declare module 'component-url' {
  function parse(
    url: string
  ): {
    hash: string
    host: string
    port: number
    hostname: string
    href: string
    pathname: string
    protocol: string
    query: string
    search: string
  }
}
