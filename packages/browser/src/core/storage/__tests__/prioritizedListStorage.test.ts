import jar from 'js-cookie'
import { CookieStorage } from '../cookieStorage'
import { LocalStorage } from '../localStorage'
import { MemoryStorage } from '../memoryStorage'
import { UniversalStorage } from '../universalStorage'
describe('prioritizedListStorage', function () {
  const defaultTargets = [
    new CookieStorage(),
    new LocalStorage(),
    new MemoryStorage(),
  ]
  const getFromLS = (key: string) => JSON.parse(localStorage.getItem(key) ?? '')
  beforeEach(function () {
    clear()
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
      const us = new UniversalStorage(defaultTargets)
      expect(us.get('ajs_test_key')).toEqual('🍪')
    })

    it('returns null if there are no storage targets', function () {
      jar.set('ajs_test_key', '🍪')
      localStorage.setItem('ajs_test_key', '💾')
      const us = new UniversalStorage([])
      expect(us.get('ajs_test_key')).toBeNull()
    })

    //   it('can override the default targets', function () {
    //     jar.set('ajs_test_key', '🍪')
    //     localStorage.setItem('ajs_test_key', '💾')
    //     const us = new PrioritizedListStorage(
    //       defaultTargets
    //     )
    //     expect(us.get('ajs_test_key', ['localStorage'])).toEqual('💾')
    //     expect(us.get('ajs_test_key', ['localStorage', 'memory'])).toEqual('💾')
    //     expect(us.get('ajs_test_key', ['cookie', 'memory'])).toEqual('🍪')
    //     expect(us.get('ajs_test_key', ['cookie', 'localStorage'])).toEqual('🍪')
    //     expect(us.get('ajs_test_key', ['cookie'])).toEqual('🍪')
    //     expect(us.get('ajs_test_key', ['memory'])).toEqual(null)
    //   })
  })

  describe('#set', function () {
    it('set the data in all storage types', function () {
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

    it('does not write to cookies when cookies are not available', function () {
      const cookieStore = new CookieStorage()
      jest.spyOn(cookieStore, 'available', 'get').mockReturnValueOnce(false)
      const us = new UniversalStorage([
        new LocalStorage(),
        cookieStore,
        new MemoryStorage(),
      ])
      us.set('ajs_test_key', '💰')
      expect(jar.get('ajs_test_key')).toEqual(undefined)
      expect(getFromLS('ajs_test_key')).toEqual('💰')
      expect(us.get('ajs_test_key')).toEqual('💰')
    })

    it('does not write to LS when LS is not available', function () {
      const localStorage = new LocalStorage()
      jest.spyOn(localStorage, 'available', 'get').mockReturnValueOnce(false)
      const us = new UniversalStorage([
        localStorage,
        new CookieStorage(),
        new MemoryStorage(),
      ])
      us.set('ajs_test_key', '💰')
      expect(jar.get('ajs_test_key')).toEqual('💰')
      expect(localStorage.get('ajs_test_key')).toEqual(null)
      expect(us.get('ajs_test_key')).toEqual('💰')
    })

    //   it('can override the default targets', function () {
    //     const us = new UniversalStorage(
    //       defaultTargets,
    //       getAvailableStorageOptions()
    //     )
    //     us.set('ajs_test_key', '💰', ['localStorage'])
    //     expect(jar.get('ajs_test_key')).toEqual(undefined)
    //     expect(getFromLS('ajs_test_key')).toEqual('💰')
    //     expect(us.get('ajs_test_key')).toEqual('💰')

    //     us.set('ajs_test_key_2', '🦴', ['cookie'])
    //     expect(jar.get('ajs_test_key_2')).toEqual('🦴')
    //     expect(localStorage.getItem('ajs_test_key_2')).toEqual(null)
    //     expect(us.get('ajs_test_key_2')).toEqual('🦴')

    //     us.set('ajs_test_key_3', '👻', [])
    //     expect(jar.get('ajs_test_key_3')).toEqual(undefined)
    //     expect(localStorage.getItem('ajs_test_key_3')).toEqual(null)
    //     expect(us.get('ajs_test_key_3')).toEqual(null)
    //   })
  })
})
