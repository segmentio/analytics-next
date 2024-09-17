import { setLocation } from '../../../../test-helpers/set-location'
import { containsContentType, isSameDomain } from '../helpers'

describe(isSameDomain, () => {
  it('should work if both domains are subdomains', () => {
    setLocation({ hostname: 'hello.bar.com' })
    expect(isSameDomain('https://foo.bar.com')).toBe(true)
  })

  it('should handle common uses cases with country code TLDs', () => {
    setLocation({ hostname: 'hello.foo.co.uk' })
    expect(isSameDomain('https://foo.co.uk')).toBe(true)

    setLocation({ hostname: 'hello.baz.foo.co.uk' })
    expect(isSameDomain('https://bar.foo.co.uk')).toBe(true)

    setLocation({ hostname: 'hello.baz.something-else.co.uk' })
    expect(isSameDomain('https://bar.foo.co.uk')).toBe(false)
  })

  it('should only match first party domains', () => {
    setLocation({ hostname: 'example.com' })
    expect(isSameDomain('https://example.com')).toBe(true)
    expect(isSameDomain('https://www.example.com')).toBe(true)
    expect(isSameDomain('https://www.example.com/api/foo')).toBe(true)
    expect(isSameDomain('https://www.foo.com')).toBe(false)
    expect(
      isSameDomain('https://cdn.segment.com/v1/projects/1234/versions/1')
    ).toBe(false)
  })

  it('should work with subdomains', () => {
    setLocation({ hostname: 'api.example.com' })
    expect(isSameDomain('https://api.example.com/foo')).toBe(true)
    expect(isSameDomain('https://foo.com/foo')).toBe(false)
    expect(isSameDomain('https://example.com/foo')).toBe(true)
  })

  it('should always allow relative domains', () => {
    setLocation({ hostname: 'example.com' })
    expect(isSameDomain('/foo/bar')).toBe(true)
    expect(isSameDomain('foo/bar')).toBe(true)
    expect(isSameDomain('foo')).toBe(true)
  })

  it('should handle www differences', () => {
    setLocation({ hostname: 'foo.previews.console.stage.twilio.com' })
    expect(isSameDomain('https://www.stage.twilio.com/foo')).toBe(true)
    expect(isSameDomain('https://stage.twilio.com/foo')).toBe(true)

    setLocation({ hostname: 'www.foo.previews.console.stage.twilio.com' })
    expect(isSameDomain('https://www.stage.twilio.com/foo')).toBe(true)
    expect(isSameDomain('https://stage.twilio.com/foo')).toBe(true)
    expect(isSameDomain('https://bar.baz.com/foo')).toBe(false)
  })
})

describe(containsContentType, () => {
  it('should return true if headers specified content type', () => {
    const headers = new Headers({ 'content-type': 'application/json' })
    expect(containsContentType(headers, ['application/json'])).toBe(true)
  })

  it('should return true if headers one of the specified content type', () => {
    const headers = new Headers({ 'content-type': 'application/json' })
    expect(
      containsContentType(headers, ['application/json', 'text/html'])
    ).toBe(true)
  })
  it('should be case insensitive', () => {
    expect(
      containsContentType(new Headers({ 'Content-Type': 'application/json' }), [
        'application/json',
      ])
    ).toBe(true)
    expect(
      containsContentType(new Headers({ 'Content-Type': 'application/json' }), [
        'application/json',
      ])
    ).toBe(true)
  })

  it('should ignore charset', () => {
    expect(
      containsContentType(
        new Headers({ 'Content-Type': 'application/json;charset=utf-8' }),
        ['application/json']
      )
    ).toBe(true)

    expect(
      containsContentType(
        new Headers({ 'Content-Type': 'application/json; charset=utf-8' }),
        ['application/json']
      )
    ).toBe(true)
    expect(
      containsContentType(new Headers({ 'Content-Type': 'application/json' }), [
        'application/json',
      ])
    ).toBe(true)
  })

  it('should return false if headers do not contain application/json', () => {
    const headers = new Headers({ 'content-type': 'text/html' })
    expect(containsContentType(headers, ['application/json'])).toBe(false)
    expect(containsContentType(new Headers(), ['application/json'])).toBe(false)
    expect(containsContentType(undefined, ['application/json'])).toBe(false)
  })
})
