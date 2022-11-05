import { tryCreateFormattedUrl } from '../create-url'

describe(tryCreateFormattedUrl, () => {
  it('should create a valid url', () => {
    expect(tryCreateFormattedUrl('http://foo.com', '/bar')).toBe(
      'http://foo.com/bar'
    )
  })
  it('should work if the path has many segments', () => {
    expect(tryCreateFormattedUrl('http://foo.com', '/bar/baz')).toBe(
      'http://foo.com/bar/baz'
    )
  })
  it('should ignore slashes', () => {
    const result = 'http://foo.com/bar'
    expect(tryCreateFormattedUrl('http://foo.com/', '/bar')).toBe(result)
    expect(tryCreateFormattedUrl('http://foo.com', 'bar')).toBe(result)
    expect(tryCreateFormattedUrl('http://foo.com', '/bar')).toBe(result)
  })
  it('should throw if no http', () => {
    expect(() => tryCreateFormattedUrl('foo.com', '/bar')).toThrowError()
  })
  it('should throw if no url', () => {
    expect(() => tryCreateFormattedUrl('', '/bar')).toThrowError()
  })
  it('should not require .com', () => {
    expect(tryCreateFormattedUrl('http://foo', 'bar')).toBe('http://foo/bar')
  })
  it('should strip the trailing slash if path is', () => {
    expect(tryCreateFormattedUrl('http://foo.com/')).toBe('http://foo.com')
    expect(tryCreateFormattedUrl('http://foo.com/', 'bar/')).toBe(
      'http://foo.com/bar'
    )
  })
})
