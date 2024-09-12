import { loadScript } from '../load-script'

describe(loadScript, () => {
  const clearDocumentHTML = () => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  }

  beforeEach(() => {
    clearDocumentHTML()
  })

  it('should create and load a new script if not already present', async () => {
    const src = 'https://example.com/bar.js'
    const attributes = { 'data-test': 'test' }
    const loadScriptP = loadScript(src, attributes)
    setTimeout(() => {
      const script = document.querySelector(`script[src="${src}"]`)!
      expect(script!.getAttribute('status')).toBe('loading')
      script!.dispatchEvent(new Event('load'))
    }, 0)

    const script = await loadScriptP
    expect(script).not.toBeNull()
    expect(script!.getAttribute('data-test')).toBe('test')
    expect(script!.getAttribute('status')).toBe('loaded')
  })

  it('should resolve with the script element if the script is already loading', async () => {
    const src = 'https://example.com/script.js'
    const script = document.createElement('script')
    script.src = src
    script.setAttribute('status', 'loading')
    document.head.appendChild(script)

    setTimeout(() => {
      script.dispatchEvent(new Event('load'))
    }, 0)

    const result = await loadScript(src)
    expect(result).toBe(script)
  })

  it('should reject if the script fails to load', async () => {
    const src = 'https://example.com/foo.js'
    const loadScriptP = loadScript(src)

    setTimeout(() => {
      const script = document.querySelector(`script[src="${src}"]`)
      script!.dispatchEvent(new Event('error'))
    }, 0)

    await expect(loadScriptP).rejects.toThrow(`Failed to load ${src}`)
  })

  it('should append above the nearest script tag if there is an existing script tag', async () => {
    document.head.innerHTML = ''
    document.body.innerHTML = '<h1>Hello</h1><script id="foo"></script>'
    const src = 'https://example.com/bar.js'
    const loadScriptP = loadScript(src)
    setTimeout(() => {
      const script = document.querySelector(`script[src="${src}"]`)!
      script!.dispatchEvent(new Event('load'))
    }, 0)

    await loadScriptP
    expect(document.body).toMatchInlineSnapshot(`
      <body>
        <h1>
          Hello
        </h1>
        <script
          src="https://example.com/bar.js"
          status="loaded"
          type="text/javascript"
        />
        <script
          id="foo"
        />
      </body>
    `)
  })

  it('should append to head if no existing script tags', async () => {
    document.head.innerHTML = '<title>Some Title</title>'
    const src = 'https://example.com/bar.js'
    const loadScriptP = loadScript(src)
    setTimeout(() => {
      const script = document.querySelector(`script[src="${src}"]`)!
      script!.dispatchEvent(new Event('load'))
    }, 0)

    await loadScriptP
    expect(document.head.innerHTML).toMatchInlineSnapshot(
      `"<title>Some Title</title><script type="text/javascript" src="https://example.com/bar.js" status="loaded"></script>"`
    )
  })
})
