import { setLocation } from '../../../test-helpers/set-location'
import { normalizeUrl } from '../normalize-url'

describe('normalizeUrl', () => {
  beforeEach(() => {
    setLocation({ hostname: 'www.currentsite.com', protocol: 'https:' })
  })

  it('should return the same URL if it starts with http', () => {
    const url = 'https://www.example.com'
    expect(normalizeUrl(url)).toBe('https://www.example.com')
  })

  it('should work with subdomains', () => {
    const url = 'https://api.example.com'
    expect(normalizeUrl(url)).toBe('https://api.example.com')
  })

  it('should prepend hostname to path starting with /', () => {
    const url = '/foo/bar'
    expect(normalizeUrl(url)).toBe('www.currentsite.com/foo/bar')
  })

  it('should prepend hostname and / to path not starting with /', () => {
    const url = 'foo/bar'
    expect(normalizeUrl(url)).toBe('www.currentsite.com/foo/bar')
  })

  it('should prepend hostname and / to a single word path', () => {
    const url = 'foo'
    expect(normalizeUrl(url)).toBe('www.currentsite.com/foo')
  })

  it('should use the current protocol of the page if none is provided', () => {
    const url = 'example.com/bar'
    setLocation({ protocol: 'http:' })
    expect(normalizeUrl(url)).toBe('http://example.com/bar')
  })

  it('should work if no /', () => {
    const url = 'example.com'
    setLocation({ protocol: 'http:' })
    expect(normalizeUrl(url)).toBe('http://example.com')
  })

  it('protocols should work with subdomains', () => {
    const url = 'api.example.com/foo'
    setLocation({ protocol: 'http:' })
    expect(normalizeUrl(url)).toBe('http://api.example.com/foo')
  })
})
