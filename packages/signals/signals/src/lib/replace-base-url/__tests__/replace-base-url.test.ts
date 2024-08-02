import { replaceBaseUrl } from '../index'

describe(replaceBaseUrl, () => {
  it('replaces the base URL while preserving the path', () => {
    const originalUrl = 'http://example.com/path/to/resource'
    const newBase = 'https://newexample.com'
    const expected = 'https://newexample.com/path/to/resource'
    expect(replaceBaseUrl(originalUrl, newBase)).toBe(expected)
  })

  it('adds https protocol to newBase if missing', () => {
    const originalUrl = 'http://example.com/path/to/resource'
    const newBase = 'newexample.com'
    const expected = 'https://newexample.com/path/to/resource'
    expect(replaceBaseUrl(originalUrl, newBase)).toBe(expected)
  })

  it('preserves query parameters and fragments', () => {
    const originalUrl = 'http://example.com/path?query=123#fragment'
    const newBase = 'https://newexample.com'
    const expected = 'https://newexample.com/path?query=123#fragment'
    expect(replaceBaseUrl(originalUrl, newBase)).toBe(expected)
  })

  it('handles URLs without a path', () => {
    const originalUrl = 'http://example.com'
    const newBase = 'https://newexample.com'
    const expected = 'https://newexample.com'
    expect(replaceBaseUrl(originalUrl, newBase)).toBe(expected)
  })

  it('correctly replaces URLs with an https protocol', () => {
    const originalUrl = 'https://example.com/path/to/resource'
    const newBase = 'https://newexample.com'
    const expected = 'https://newexample.com/path/to/resource'
    expect(replaceBaseUrl(originalUrl, newBase)).toBe(expected)
  })
})
