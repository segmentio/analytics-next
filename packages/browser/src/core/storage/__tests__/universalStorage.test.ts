import jar from 'js-cookie'
import { CookieStorage } from '../cookieStorage'
import { LocalStorage } from '../localStorage'
import { MemoryStorage } from '../memoryStorage'
import { UniversalStorage } from '../universalStorage'
import { disableCookies, disableLocalStorage } from './test-helpers'

describe('UniversalStorage', function () {
  const defaultTargets = [
    new CookieStorage(),
    new LocalStorage(),
    new MemoryStorage(),
  ]
  const getFromLS = (key: string) => JSON.parse(localStorage.getItem(key) ?? '')
  beforeEach(function () {
    clear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  function clear(): void {
    document.cookie.split(';').forEach(function (c) {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
    })
    localStorage.clear()
  }

  describe('#get', function () {
    it('picks data from cookies first', function () {
      jar.set('ajs_test_key', '🍪')
      localStorage.setItem('ajs_test_key', '💾')
      const us = new UniversalStorage(defaultTargets)
      expect(us.get('ajs_test_key')).toEqual('🍪')
    })

    it('picks data from localStorage if there is no cookie target', function () {
      jar.set('ajs_test_key', '🍪')
      localStorage.setItem('ajs_test_key', '💾')
      const us = new UniversalStorage([new LocalStorage(), new MemoryStorage()])
      expect(us.get('ajs_test_key')).toEqual('💾')
    })

    it('get data from memory', function () {
      jar.set('ajs_test_key', '🍪')
      localStorage.setItem('ajs_test_key', '💾')
      const us = new UniversalStorage([new MemoryStorage()])
      expect(us.get('ajs_test_key')).toBeNull()
    })

    it('order of default targets matters!', function () {
      jar.set('ajs_test_key', '🍪')
      localStorage.setItem('ajs_test_key', '💾')
      const us = new UniversalStorage([
        new LocalStorage(),
        new CookieStorage(),
        new MemoryStorage(),
      ])
      expect(us.get('ajs_test_key')).toEqual('💾')
    })

    it('returns null if there are no storage targets', function () {
      jar.set('ajs_test_key', '🍪')
      localStorage.setItem('ajs_test_key', '💾')
      const us = new UniversalStorage([])
      expect(us.get('ajs_test_key')).toBeNull()
    })
  })

  describe('#set', function () {
    it('sets the data in all storage types', function () {
      const us = new UniversalStorage<{ ajs_test_key: string }>(defaultTargets)
      us.set('ajs_test_key', '💰')
      expect(jar.get('ajs_test_key')).toEqual('💰')
      expect(getFromLS('ajs_test_key')).toEqual('💰')
    })

    it('skip saving data to localStorage', function () {
      const us = new UniversalStorage([
        new CookieStorage(),
        new MemoryStorage(),
      ])
      us.set('ajs_test_key', '💰')
      expect(jar.get('ajs_test_key')).toEqual('💰')
      expect(localStorage.getItem('ajs_test_key')).toEqual(null)
    })

    it('skip saving data to cookie', function () {
      const us = new UniversalStorage([new LocalStorage(), new MemoryStorage()])
      us.set('ajs_test_key', '💰')
      expect(jar.get('ajs_test_key')).toEqual(undefined)
      expect(getFromLS('ajs_test_key')).toEqual('💰')
    })

    it('can save and retrieve from memory when there is no other storage', function () {
      const us = new UniversalStorage([new MemoryStorage()])
      us.set('ajs_test_key', '💰')
      expect(jar.get('ajs_test_key')).toEqual(undefined)
      expect(localStorage.getItem('ajs_test_key')).toEqual(null)
      expect(us.get('ajs_test_key')).toEqual('💰')
    })

    it('handles cookie errors gracefully', function () {
      disableCookies() // Cookies is going to throw exceptions now
      const us = new UniversalStorage([
        new LocalStorage(),
        new CookieStorage(),
        new MemoryStorage(),
      ])
      us.set('ajs_test_key', '💰')
      expect(getFromLS('ajs_test_key')).toEqual('💰')
      expect(us.get('ajs_test_key')).toEqual('💰')
    })

    it('does not write to LS when LS is not available', function () {
      disableLocalStorage() // Localstorage will throw exceptions
      const us = new UniversalStorage([
        new LocalStorage(),
        new CookieStorage(),
        new MemoryStorage(),
      ])
      us.set('ajs_test_key', '💰')
      expect(jar.get('ajs_test_key')).toEqual('💰')
      expect(us.get('ajs_test_key')).toEqual('💰')
    })
  })
})
