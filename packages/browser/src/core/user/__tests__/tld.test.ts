import cookie from 'js-cookie'
import { tld } from '../tld'
import assert from 'assert'

describe('topDomain', function () {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cookies: Record<string, any> = {}

    // @ts-ignore
    jest.spyOn(cookie, 'set').mockImplementation((key, val, opts) => {
      const parts = opts?.domain?.split('.') ?? []
      if (parts[1] === 'co') return
      cookies[key] = val
      return val
    })

    // @ts-ignore
    jest.spyOn(cookie, 'get').mockImplementation((key) => {
      return cookies[key]
    })
  })

  it('should match the following urls', function () {
    assert.strictEqual(tld('http://www.google.com'), 'google.com')
    assert.strictEqual(
      tld('http://gist.github.com/calvinfo/some_file'),
      'github.com'
    )
    assert.strictEqual(tld('http://localhost:3000'), undefined)
    assert.strictEqual(tld('https://google.com:443/stuff'), 'google.com')
    assert.strictEqual(tld('http://dev:3000'), undefined)
    assert.strictEqual(tld('http://app.jut.io'), 'jut.io')
    assert.strictEqual(tld('http://app.segment.io'), 'segment.io')
  })

  it('memoizes the resolved domain per hostname, instead of re-probing cookies every call', function () {
    const setSpy = jest.spyOn(cookie, 'set')

    assert.strictEqual(
      tld('http://sub.memoize-example.com/path-a'),
      'memoize-example.com'
    )
    const callsAfterFirst = setSpy.mock.calls.length

    assert.strictEqual(
      tld('http://sub.memoize-example.com/path-b'),
      'memoize-example.com'
    )
    assert.strictEqual(setSpy.mock.calls.length, callsAfterFirst)
  })

  it('warns and does not throw when a domain cannot be resolved (e.g. sandboxed cookie access)', function () {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(cookie, 'set').mockImplementation(() => {
      throw new Error('cookie access blocked')
    })

    assert.strictEqual(tld('http://app.blocked-example.com'), undefined)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toContain('app.blocked-example.com')

    warnSpy.mockRestore()
  })

  it('does not warn for localhost or IP hosts, since undefined is expected there', function () {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    tld('http://localhost:3000')
    tld('http://192.168.0.1:3000')

    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
