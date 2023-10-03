import {
  BufferedPageContextDiscriminant,
  getDefaultBufferedPageContext,
  getDefaultPageContext,
  isBufferedPageContext,
} from '../'
import { pickBy } from 'lodash'

const originalLocation = window.location
beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: {
      ...originalLocation,
    },
    writable: true,
  })
})

describe(isBufferedPageContext, () => {
  it('should return true if object is page context', () => {
    expect(isBufferedPageContext(getDefaultBufferedPageContext())).toBe(true)
  })
  it('should return false if object is not page context', () => {
    expect(isBufferedPageContext(undefined)).toBe(false)
    expect(isBufferedPageContext({})).toBe(false)
    expect(isBufferedPageContext('')).toBe(false)
    expect(isBufferedPageContext({ foo: false })).toBe(false)
    expect(isBufferedPageContext({ u: 'hello' })).toBe(false)
    expect(isBufferedPageContext(null)).toBe(false)

    expect(
      isBufferedPageContext({
        ...getDefaultBufferedPageContext(),
        some_unknown_key: 123,
      })
    ).toBe(false)

    const missingDiscriminant = pickBy(
      getDefaultBufferedPageContext(),
      (v) => v !== BufferedPageContextDiscriminant
    )
    // should not be missing the dscriminant
    expect(isBufferedPageContext(missingDiscriminant)).toBe(false)
  })
})

describe(getDefaultPageContext, () => {
  describe('hash', () => {
    it('strips the hash from the URL', () => {
      window.location.href = 'http://www.segment.local#test'
      const defs = getDefaultPageContext()
      expect(defs.url).toBe('http://www.segment.local')

      window.location.href = 'http://www.segment.local/#test'
      const defs2 = getDefaultPageContext()
      expect(defs2.url).toBe('http://www.segment.local/')
    })
  })

  describe('canonical URL', () => {
    const el = document.createElement('link')
    beforeEach(() => {
      el.setAttribute('rel', 'canonical')
      el.setAttribute('href', '')
      document.clear()
    })

    it('returns location.href if canonical URL does not exist', () => {
      el.setAttribute('rel', 'nope')
      document.body.appendChild(el)
      const defs = getDefaultPageContext()
      expect(defs.url).toEqual(window.location.href)
    })

    it('does not throw an error if canonical URL is not a valid URL', () => {
      el.setAttribute('href', 'foo.com/bar')
      document.body.appendChild(el)
      const defs = getDefaultPageContext()
      expect(defs.url).toEqual('foo.com/bar') // this is analytics.js classic behavior
      expect(defs.path).toEqual('/foo.com/bar') // this is analytics.js classic behavior
    })

    it('handles a leading slash', () => {
      el.setAttribute('href', 'foo')
      document.body.appendChild(el)
      const defs = getDefaultPageContext()
      expect(defs.url).toEqual('foo')
      expect(defs.path).toEqual('/foo') // this is analytics.js classic behavior
    })

    it('handles canonical links', () => {
      el.setAttribute('href', 'http://www.segment.local')
      document.body.appendChild(el)
      const defs = getDefaultPageContext()
      expect(defs.url).toEqual('http://www.segment.local')
    })

    it('favors canonical path over location.pathname', () => {
      window.location.pathname = '/nope'
      el.setAttribute('href', 'http://www.segment.local/test')
      document.body.appendChild(el)
      const defs = getDefaultPageContext()
      expect(defs.path).toEqual('/test')
    })

    it('handles canonical links with a path', () => {
      el.setAttribute('href', 'http://www.segment.local/test')
      document.body.appendChild(el)
      const defs = getDefaultPageContext()
      expect(defs.url).toEqual('http://www.segment.local/test')
      expect(defs.path).toEqual('/test')
    })

    it('handles canonical links with search params in the url', () => {
      el.setAttribute('href', 'http://www.segment.local?test=true')
      document.body.appendChild(el)
      const defs = getDefaultPageContext()
      expect(defs.url).toEqual('http://www.segment.local?test=true')
    })

    it('will add search params from the document to the canonical path if it does not have search params', () => {
      // This seems like weird behavior to me, but I found it in the codebase so adding a test for it.
      window.location.search = '?foo=123'
      el.setAttribute('href', 'http://www.segment.local')
      document.body.appendChild(el)
      const defs = getDefaultPageContext()
      expect(defs.url).toEqual('http://www.segment.local?foo=123')
    })
  })
})
