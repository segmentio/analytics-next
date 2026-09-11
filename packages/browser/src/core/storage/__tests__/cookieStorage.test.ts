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

  describe('remove', () => {
    it('also clears a possible host-scoped duplicate when a domain is configured', () => {
      const jarRemoveSpy = jest.spyOn(jar, 'remove')
      const cookie = new CookieStorage({ domain: '.example.com', path: '/' })

      cookie.remove('foo')

      expect(jarRemoveSpy).toHaveBeenCalledWith('foo', {
        sameSite: 'Lax',
        expires: 365,
        domain: '.example.com',
        path: '/',
        secure: undefined,
      })
      expect(jarRemoveSpy).toHaveBeenCalledWith('foo', { path: '/' })
      expect(jarRemoveSpy).toHaveBeenCalledTimes(2)
    })

    it('does not attempt a second removal when there is no configured domain', () => {
      const jarRemoveSpy = jest.spyOn(jar, 'remove')
      const cookie = new CookieStorage({ domain: undefined, path: '/' })

      cookie.remove('foo')

      expect(jarRemoveSpy).toHaveBeenCalledTimes(1)
    })

    it('applies the same cleanup when setting a value to null', () => {
      const jarRemoveSpy = jest.spyOn(jar, 'remove')
      const cookie = new CookieStorage({ domain: '.example.com', path: '/' })

      cookie.set('foo', null)

      expect(jarRemoveSpy).toHaveBeenCalledTimes(2)
    })
  })
})
