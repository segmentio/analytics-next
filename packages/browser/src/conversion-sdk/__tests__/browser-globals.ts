export function installBrowserGlobals(overrides?: {
  location?: Partial<Location>
  navigator?: Partial<Navigator>
}): void {
  const location = {
    href: 'https://example.com/path?utm_source=test',
    pathname: '/path',
    search: '?utm_source=test',
    ...overrides?.location,
  }

  const navigator = {
    userAgent: 'node-test-agent',
    language: 'en-US',
    doNotTrack: undefined,
    onLine: true,
    ...overrides?.navigator,
  }

  Object.defineProperty(globalThis, 'window', {
    value: {
      location,
      navigator,
      screen: { width: 1280, height: 720 },
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      sessionStorage: {
        store: {} as Record<string, string>,
        getItem(key: string) {
          return this.store[key] ?? null
        },
        setItem(key: string, value: string) {
          this.store[key] = value
        },
      },
      localStorage: {
        store: {} as Record<string, string>,
        getItem(key: string) {
          return this.store[key] ?? null
        },
        setItem(key: string, value: string) {
          this.store[key] = value
        },
        removeItem(key: string) {
          delete this.store[key]
        },
        clear() {
          this.store = {}
        },
      },
    },
    configurable: true,
    writable: true,
  })

  Object.defineProperty(globalThis, 'location', {
    value: location,
    configurable: true,
    writable: true,
  })

  Object.defineProperty(globalThis, 'document', {
    value: {
      referrer: 'https://ref.example.com',
      title: 'Test page',
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      createElement: () => ({
        style: {},
        appendChild: () => undefined,
        addEventListener: () => undefined,
      }),
      body: { appendChild: () => undefined },
      cookie: '',
    },
    configurable: true,
    writable: true,
  })

  Object.defineProperty(globalThis, 'navigator', {
    value: navigator,
    configurable: true,
    writable: true,
  })
}
