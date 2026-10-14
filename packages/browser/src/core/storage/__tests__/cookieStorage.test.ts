import { CookieStorage } from '../cookieStorage'
import jar from 'js-cookie'

describe('cookieStorage', () => {
  function clearCookies() {
    document.cookie.split(';').forEach(function (c) {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
    })
  }

  afterEach(() => {
    clearCookies()
  })

  describe('cookie options', () => {
    it('should have default cookie options', () => {
      const cookie = new CookieStorage()
      expect(cookie['options'].domain).toBe(undefined)
      expect(cookie['options'].maxage).toBe(365)
      expect(cookie['options'].path).toBe('/')
      expect(cookie['options'].sameSite).toBe('Lax')
      expect(cookie['options'].secure).toBe(undefined)
    })

    it('should set options properly', () => {
      const cookie = new CookieStorage({
        domain: 'foo',
        secure: true,
        path: '/test',
      })
      expect(cookie['options'].domain).toBe('foo')
      expect(cookie['options'].secure).toBe(true)
      expect(cookie['options'].path).toBe('/test')
      expect(cookie['options'].secure).toBe(true)
    })

    it('should pass options when creating cookie', () => {
      const jarSpy = jest.spyOn(jar, 'set')
      const cookie = new CookieStorage({
        domain: 'foo',
        secure: true,
        path: '/test',
      })

      cookie.set('foo', 'bar')

      expect(jarSpy).toHaveBeenCalledWith('foo', 'bar', {
        domain: 'foo',
        expires: 365,
        path: '/test',
        sameSite: 'Lax',
        secure: true,
      })
    })
  })

  describe('numeric-looking string values', () => {
    it('does not round a string beyond Number.MAX_SAFE_INTEGER', () => {
      const cookie = new CookieStorage()
      cookie.set('id', '7689174720735493772')
      expect(cookie.get('id')).toBe('7689174720735493772')
    })

    it.each(['1e3', '1.50', '123456789012345678901234567890'])(
      'does not mangle %s',
      (value) => {
        jar.set('id', value)
        expect(new CookieStorage().get('id')).toBe(value)
      }
    )

    it('still parses numbers that round-trip exactly', () => {
      jar.set('id', '12345')
      expect(new CookieStorage().get('id')).toBe(12345)
    })
  })
})
