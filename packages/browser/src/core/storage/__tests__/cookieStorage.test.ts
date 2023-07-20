import { CookieStorage } from '../cookieStorage'
import jar from 'js-cookie'
import { disableCookies } from './test-helpers'

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

  describe('#available', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('is available', () => {
      const cookie = new CookieStorage()
      expect(cookie.available).toBe(true)
    })

    it("is unavailable if can't write cookies", () => {
      disableCookies()
      const cookie = new CookieStorage()
      expect(cookie.available).toBe(false)
    })
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
})
