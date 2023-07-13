import {
  User,
  LocalStorage,
  Cookie,
  Group,
  UniversalStorage,
  StoreType,
  getAvailableStorageOptions,
} from '..'
import jar from 'js-cookie'
import assert from 'assert'

function clear(): void {
  document.cookie.split(';').forEach(function (c) {
    document.cookie = c
      .replace(/^ +/, '')
      .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
  })
  localStorage.clear()
}

/**
 * Filters out the calls made for probing cookie availability
 */
const ignoreProbeCookieWrites = (
  fn: jest.SpyInstance<
    string | undefined,
    [
      name: string,
      value: string | object,
      options?: jar.CookieAttributes | undefined
    ]
  >
) => fn.mock.calls.filter((c) => c[0] !== 'ajs_cookies')

let store: LocalStorage
beforeEach(function () {
  store = new LocalStorage()
  clear()
})

jest.spyOn(console, 'warn').mockImplementation(() => {}) // silence console spam.

describe('user', () => {
  const cookieKey = User.defaults.cookie.key
  const localStorageKey = User.defaults.localStorage.key

  describe('()', () => {
    it('should pick the old "_sio" anonymousId', () => {
      jar.set('_sio', 'anonymous-id----user-id')
      const user = new User()
      expect(user.anonymousId()).toEqual('anonymous-id')
    })

    it('should not pick the old "_sio" if anonymous id is present', () => {
      jar.set('_sio', 'old-anonymous-id----user-id')
      jar.set('ajs_anonymous_id', 'new-anonymous-id')
      assert(new User().anonymousId() === 'new-anonymous-id')
    })

    it('should create anonymous id if missing (persist: default (true))', () => {
      const user = new User()
      assert(user.anonymousId()?.length === 36)
      expect(jar.get('ajs_anonymous_id')?.length).toBe(36)
      expect(localStorage.getItem('ajs_anonymous_id')?.length).toBe(38)
    })

    it('should create anonymous id if missing (persist: false)', () => {
      const setCookieSpy = jest.spyOn(jar, 'set')

      const user = new User({ persist: false })
      assert(user.anonymousId()?.length === 36)
      expect(jar.get('ajs_anonymous_id')).toBeUndefined()
      expect(localStorage.getItem('ajs_anonymous_id')).toBeNull()
      expect(ignoreProbeCookieWrites(setCookieSpy).length).toBe(0)
    })

    it('should not overwrite anonymous id', () => {
      jar.set('ajs_anonymous_id', 'anonymous')
      expect(new User().anonymousId()).toEqual('anonymous')
    })
  })

  describe('#id', () => {
    let user: User

    beforeEach(() => {
      user = new User()
    })

    describe('when cookies are disabled', () => {
      beforeEach(() => {
        jest.spyOn(Cookie, 'available').mockReturnValueOnce(false)

        user = new User()
        clear()
      })

      it('should not reset id with new user', () => {
        store.set(cookieKey, 'id')
        user = new User()
        assert(user.id() === 'id')
      })

      it('should get an id from the store', () => {
        store.set(cookieKey, 'id')
        assert(user.id() === 'id')
      })

      it('should set an id to the store', () => {
        user.id('id')
        assert(store.get(cookieKey) === 'id')
      })

      it('should set the id when not persisting', () => {
        user = new User({ persist: false })
        user.id('id')
        assert(user.id() === 'id')
      })

      it('should be null by default', () => {
        assert(user.id() === null)
      })

      it('should not reset anonymousId if the user didnt have previous id', () => {
        const prev = user.anonymousId()

        user.id('foo')
        user.id('foo')
        user.id('foo')

        assert(user.anonymousId() === prev)
      })

      it('should reset anonymousId if the user id changed', () => {
        user.anonymousId('bla')

        const prev = user.anonymousId()
        user.id('foo')
        user.id('baz')

        expect(user.anonymousId()).not.toEqual(prev)
        expect(user.anonymousId()?.length).toBe(36)
      })

      it('should not reset anonymousId if the user id changed to null', () => {
        const prev = user.anonymousId()
        user.id('foo')
        user.id(null)
        assert(user.anonymousId() === prev)
        assert(user.anonymousId()?.length === 36)
      })
    })

    describe('when cookies and localStorage are disabled', () => {
      beforeEach(() => {
        jest.spyOn(Cookie, 'available').mockReturnValueOnce(false)
        jest.spyOn(LocalStorage, 'available').mockReturnValueOnce(false)

        user = new User()
        clear()
      })

      it('should get an id from memory', () => {
        user.id('id')
        assert(user.id() === 'id')

        expect(jar.get(cookieKey)).toBeFalsy()
        expect(store.get(cookieKey)).toBeFalsy()
      })

      it('should get an id when not persisting', () => {
        user = new User({ persist: false })
        user.id('id')
        assert(user.id() === 'id')
      })

      it('should be null by default', () => {
        assert(user.id() === null)
      })

      it('should not reset anonymousId if the user didnt have previous id', () => {
        const prev = user.anonymousId()
        user.id('foo')
        user.id('foo')
        user.id('foo')

        assert(user.anonymousId() === prev)
      })

      it('should reset anonymousId if the user id changed', () => {
        const prev = user.anonymousId()
        user.id('foo')
        user.id('baz')
        assert(user.anonymousId() !== prev)
        assert(user.anonymousId()?.length === 36)
      })

      it('should not reset anonymousId if the user id changed to null', () => {
        const prev = user.anonymousId()
        user.id('foo')
        user.id(null)
        assert(user.anonymousId() === prev)
        assert(user.anonymousId()?.length === 36)
      })
    })

    describe('when persist is disabled', () => {
      let setCookieSpy: jest.SpyInstance
      beforeEach(() => {
        setCookieSpy = jest.spyOn(jar, 'set')
        user = new User({ persist: false })
        clear()
      })

      it('should get an id from memory', () => {
        user.id('id')
        assert(user.id() === 'id')

        expect(jar.get(cookieKey)).toBeFalsy()
        expect(store.get(cookieKey)).toBeFalsy()
      })

      it('should be null by default', () => {
        assert(user.id() === null)
      })

      it('should not reset anonymousId if the user didnt have previous id', () => {
        const prev = user.anonymousId()
        user.id('foo')
        user.id('foo')
        user.id('foo')

        assert(user.anonymousId() === prev)
        expect(ignoreProbeCookieWrites(setCookieSpy).length).toBe(0)
      })

      it('should reset anonymousId if the user id changed', () => {
        const prev = user.anonymousId()
        user.id('foo')
        user.id('baz')
        assert(user.anonymousId() !== prev)
        assert(user.anonymousId()?.length === 36)
        expect(ignoreProbeCookieWrites(setCookieSpy).length).toBe(0)
      })

      it('should not reset anonymousId if the user id changed to null', () => {
        const prev = user.anonymousId()
        user.id('foo')
        user.id(null)
        assert(user.anonymousId() === prev)
        assert(user.anonymousId()?.length === 36)
        expect(ignoreProbeCookieWrites(setCookieSpy).length).toBe(0)
      })
    })

    describe('when disabled', () => {
      beforeEach(() => {
        user = new User({ disable: true })
      })

      it('should always be null', () => {
        expect(user.id()).toBeNull()
        expect(user.id('foo')).toBeNull()
        expect(user.id()).toBeNull()
      })
    })

    describe('when cookies are enabled', () => {
      it('should get an id from the cookie', () => {
        jar.set(cookieKey, 'id')
        assert(user.id() === 'id')
      })

      it('should set an id to the cookie', () => {
        user.id('id')
        assert(jar.get(cookieKey) === 'id')
      })

      it('should get an id when not persisting', function () {
        user = new User({ persist: false })
        user.id('id')
        assert(user.id() === 'id')
      })

      it('should be null by default', () => {
        assert(user.id() === null)
      })

      it('should parse integer values', () => {
        // @ts-expect-error the library only accepts strings or objects,
        // but AJS Classic allows setting numbers on cookie values, so we have
        // to parse them back to string.
        jar.set(cookieKey, 1234)
        assert(user.id() === '1234')
      })

      it('should not reset anonymousId if the user didnt have previous id', () => {
        const prev = user.anonymousId()
        user.id('foo')
        user.id('foo')
        user.id('foo')
        assert(user.anonymousId() === prev)
      })

      it('should reset anonymousId if the user id changed', () => {
        const prev = user.anonymousId()
        user.id('foo')
        user.id('baz')
        assert(user.anonymousId() !== prev)
        assert(user.anonymousId()?.length === 36)
      })
    })
  })

  describe('#anonymousId', () => {
    let user: User

    beforeEach(() => {
      user = new User()
    })

    describe('when cookies are disabled', () => {
      beforeEach(() => {
        jest.spyOn(Cookie, 'available').mockReturnValueOnce(false)

        user = new User()
      })

      it('should get an id from the store', () => {
        store.set('ajs_anonymous_id', 'anon-id')
        expect(user.anonymousId()).toEqual('anon-id')
      })

      it('should set an id to the store', () => {
        user.anonymousId('anon-id')
        assert(store.get('ajs_anonymous_id') === 'anon-id')
      })

      it('should return anonymousId using the store', () => {
        user.anonymousId('anon-id')
        assert(user.anonymousId() === 'anon-id')
      })

      it('should get an id without quotes from the store', () => {
        window.localStorage.setItem('ajs_anonymous_id', 'abc-def')
        assert(user.anonymousId() === 'abc-def')
      })
    })

    describe('when cookies and localStorage are disabled', () => {
      beforeEach(() => {
        jest.spyOn(LocalStorage, 'available').mockReturnValueOnce(false)
        jest.spyOn(Cookie, 'available').mockReturnValueOnce(false)

        user = new User()
      })

      it('should get an id from memory', () => {
        user.anonymousId('anon-id')
        assert(user.anonymousId() === 'anon-id')
        expect(jar.get('ajs_anonymous_id')).toBeFalsy()
      })
    })

    describe('when cookies are enabled', () => {
      it('should get an id from the cookie', () => {
        jar.set('ajs_anonymous_id', 'anon-id')
        assert(user.anonymousId() === 'anon-id')
      })

      it('should set an id to the cookie', () => {
        user.anonymousId('anon-id')
        assert(jar.get('ajs_anonymous_id') === 'anon-id')
      })

      it('should set anonymousId in both cookie and localStorage', () => {
        user.anonymousId('anon0')
        assert.equal(jar.get('ajs_anonymous_id'), 'anon0')
        assert.equal(store.get('ajs_anonymous_id'), 'anon0')
      })

      it('should not set anonymousId in localStorage when localStorage fallback is disabled', () => {
        user = new User({
          localStorageFallbackDisabled: true,
        })

        user.anonymousId('anon0')
        assert.equal(jar.get('ajs_anonymous_id'), 'anon0')
        assert.equal(store.get('ajs_anonymous_id'), null)
      })

      it('should copy value from cookie to localStorage', () => {
        user = new User()
        jar.set('ajs_anonymous_id', 'anon1')

        assert.equal(user.anonymousId(), 'anon1')
        assert.equal(store.get('ajs_anonymous_id'), 'anon1')
      })

      it('should not copy value from cookie to localStorage when localStorage fallback is disabled', () => {
        user = new User({
          localStorageFallbackDisabled: true,
        })
        jar.set('ajs_anonymous_id', 'anon1')
        assert.equal(user.anonymousId(), 'anon1')
        assert.equal(store.get('ajs_anonymous_id'), null)
      })

      it('should fall back to localStorage when cookie is not set', () => {
        user = new User()
        user.anonymousId('anon12')
        assert.equal(jar.get('ajs_anonymous_id'), 'anon12')

        // delete the cookie
        jar.remove('ajs_anonymous_id')
        assert.equal(jar.get('ajs_anonymous_id'), null)

        // verify anonymousId() returns the correct id even when there's no cookie
        assert.equal(user.anonymousId(), 'anon12')

        // verify cookie value is restored from localStorage
        assert.equal(jar.get('ajs_anonymous_id'), 'anon12')
      })

      it('should write to both cookie and localStorage when generating a new anonymousId', () => {
        user = new User()
        user.anonymousId('bla')
        const anonId = user.anonymousId()

        assert.notEqual(anonId, null)
        assert.equal(jar.get('ajs_anonymous_id'), anonId)
        assert.equal(store.get('ajs_anonymous_id'), anonId)
      })

      it('should not write to both cookie and localStorage when generating a new anonymousId and localStorage fallback is disabled', () => {
        user = new User({
          localStorageFallbackDisabled: true,
        })

        user.anonymousId('bla')
        const anonId = user.anonymousId()

        assert.notEqual(anonId, null)
        assert.equal(jar.get('ajs_anonymous_id'), anonId)
        assert.equal(store.get('ajs_anonymous_id'), null)
      })
    })

    describe('when disabled', () => {
      beforeEach(() => {
        user = new User({ disable: true })
      })

      it('should always be null', () => {
        expect(user.anonymousId()).toBeNull()
        expect(user.anonymousId('foo')).toBeNull()
        expect(user.anonymousId()).toBeNull()
      })
    })
  })

  describe('#traits', () => {
    let user: User

    beforeEach(() => {
      user = new User()
    })

    it('should get traits', () => {
      store.set(localStorageKey, { trait: true })
      expect(user.traits()).toEqual({ trait: true })
    })

    it('should get traits when not persisting', () => {
      user = new User({ persist: false })
      user.traits({ trait: true })
      expect(user.traits()).toEqual({ trait: true })
      expect(store.get(localStorageKey)).toBeNull()
    })

    it('should set traits', () => {
      user.traits({ trait: true })
      expect(store.get(localStorageKey)).toEqual({ trait: true })
    })

    it('should default traits to an empty object', () => {
      user.traits(null)
      expect(store.get(localStorageKey)).toEqual({})
    })

    it('should default traits to an empty object when not persisting', () => {
      user = new User({ persist: false })
      user.traits(null)
      expect(user.traits()).toEqual({})
    })

    it('should be an empty object by default', () => {
      expect(user.traits()).toEqual({})
    })

    it('should not reset traits on new user', () => {
      user.traits({ trait: true })
      user = new User()
      expect(user.traits()).toEqual({ trait: true })
    })

    describe('when disabled', () => {
      beforeEach(() => {
        user = new User({ disable: true })
      })

      it('should always be undefined', () => {
        expect(user.traits()).toBeUndefined()
        expect(user.traits({})).toBeUndefined()
        expect(user.traits()).toBeUndefined()
      })
    })
  })

  describe('#options', () => {
    it('should have default cookie options', () => {
      const cookie = new Cookie()
      expect(cookie['options'].domain).toBe(undefined)
      expect(cookie['options'].maxage).toBe(365)
      expect(cookie['options'].path).toBe('/')
      expect(cookie['options'].sameSite).toBe('Lax')
      expect(cookie['options'].secure).toBe(undefined)
    })

    it('should set options properly', () => {
      const cookie = new Cookie({ domain: 'foo', secure: true, path: '/test' })
      expect(cookie['options'].domain).toBe('foo')
      expect(cookie['options'].secure).toBe(true)
      expect(cookie['options'].path).toBe('/test')
      expect(cookie['options'].secure).toBe(true)
    })

    it('should pass options when creating cookie', () => {
      const jarSpy = jest.spyOn(jar, 'set')
      const cookie = new Cookie({ domain: 'foo', secure: true, path: '/test' })

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

  describe('#save', () => {
    let user: User

    beforeEach(() => {
      user = new User()
    })

    it('should save an id to a cookie', () => {
      user.id('id')
      user.save()
      expect(jar.get(cookieKey)).toEqual('id')
    })

    it('should save an id to localStorage', () => {
      user.id('id')
      user.save()
      expect(store.get(cookieKey)).toEqual('id')
    })

    it('should not save an id to localStorage when localStorage fallback is disabled', () => {
      user = new User({
        localStorageFallbackDisabled: true,
      })

      user.id('id')
      user.save()
      expect(store.get(cookieKey)).toBeNull()
    })

    it('should not get id from localStorage when fallback is disabled and id() is called', () => {
      user = new User({
        localStorageFallbackDisabled: false,
      })

      user.id('id')
      user.save()
      jar.remove(cookieKey)

      user = new User({
        localStorageFallbackDisabled: true,
      })

      user.id('foo')
      user.save()

      expect(user.id()).toEqual('foo')
      expect(store.get(cookieKey)).toEqual('id')
    })

    it('should save traits to local storage', () => {
      user.traits({ trait: true })
      user.save()
      expect(store.get(localStorageKey)).toEqual({ trait: true })
    })

    it('shouldnt save if persist is false', () => {
      user = new User({
        persist: false,
      })

      user.id('id')
      user.save()
      expect(jar.get(cookieKey)).toBeUndefined()
    })
  })

  describe('#logout', () => {
    let user: User

    beforeEach(() => {
      user = new User()
    })

    it('should reset an id and traits', () => {
      user.id('id')
      user.anonymousId('anon-id')
      user.traits({ trait: true })
      user.logout()

      expect(jar.get('ajs_anonymous_id')).toBeUndefined()
      expect(user.id()).toBeNull()
      expect(user.traits()).toEqual({})
    })

    it('should clear id in cookie', () => {
      user.id('id')
      user.save()
      user.logout()

      expect(jar.get(cookieKey)).toBeFalsy()
    })

    it('should clear id in local storage', () => {
      user.id('id')
      user.save()
      user.logout()
      expect(store.get(cookieKey)).toBeNull()
    })

    it('should clear traits in local storage', () => {
      user.traits({ trait: true })
      user.save()
      user.logout()

      expect(store.get(localStorageKey)).toEqual({})
    })
  })

  describe('#identify', () => {
    let user: User

    beforeEach(() => {
      user = new User()
    })

    it('should save an id', () => {
      user.identify('id')
      expect(user.id()).toEqual('id')
    })

    it('should save traits', () => {
      user.identify(null, { trait: true })

      expect(user.traits()).toEqual({ trait: true })
      expect(store.get(localStorageKey)).toEqual({ trait: true })
    })

    it('should save an id and traits', () => {
      user.identify('id', { trait: true })

      expect(user.id()).toEqual('id')
      expect(user.traits()).toEqual({ trait: true })

      expect(jar.get(cookieKey)).toEqual('id')
      expect(store.get(localStorageKey)).toEqual({ trait: true })
    })

    it('should extend existing traits', () => {
      user.traits({ one: 1 })
      user.identify('id', { two: 2 })

      expect(user.traits()).toEqual({ one: 1, two: 2 })
      expect(store.get(localStorageKey)).toEqual({ one: 1, two: 2 })
    })

    it('shouldnt extend existing traits for a new id', () => {
      user.id('id')
      user.traits({ one: 1 })
      user.identify('new', { two: 2 })

      expect(user.traits()).toEqual({ two: 2 })
      expect(store.get(localStorageKey)).toEqual({ two: 2 })
    })

    it('should reset traits for a new id', () => {
      user.id('id')
      user.traits({ one: 1 })
      user.identify('new')

      expect(user.traits()).toEqual({})
      expect(store.get(localStorageKey)).toEqual({})
    })
  })

  describe('#load', () => {
    let user: User

    beforeEach(() => {
      user = new User()
    })

    it('should load an empty user', () => {
      user.load()

      expect(user.id()).toBe(null)
      expect(user.traits()).toEqual({})
    })

    it('should load an id from a cookie', () => {
      jar.set(cookieKey, 'le id')
      user.load()
      expect(user.id()).toEqual('le id')
    })

    it('should load traits from local storage', () => {
      store.set(localStorageKey, { trait: true })
      user.load()
      expect(user.traits()).toEqual({ trait: true })
    })

    it('should load from an old cookie', () => {
      jar.set(
        User.defaults.cookie.oldKey,
        JSON.stringify({
          id: 'old',
          traits: { trait: true },
        })
      )

      user.load()
      expect(user.id()).toEqual('old')
      expect(user.traits()).toEqual({ trait: true })
    })

    it('load should preserve the original User cookie options', () => {
      user = new User(undefined, {
        domain: 'foo.com',
      })
      const setCookieSpy = jest.spyOn(jar, 'set')
      user.load().anonymousId('anon-id')

      expect(setCookieSpy).toHaveBeenLastCalledWith(
        'ajs_anonymous_id',
        'anon-id',
        {
          domain: 'foo.com',
          expires: 365,
          path: '/',
          sameSite: 'Lax',
          secure: undefined,
        }
      )
    })
  })
})

describe('group', () => {
  it('should not reset id and traits', () => {
    let group = new Group()
    group.id('gid')
    group.traits({ trait: true })
    group = new Group()
    expect(group.id()).toBe('gid')
    expect(group.traits()!.trait).toBe(true)
  })

  it('id() should fallback to localStorage', function () {
    const group = new Group()

    group.id('gid')

    jar.remove('ajs_group_id')

    assert.equal(jar.get('ajs_group_id'), null)
    assert.equal(group.id(), 'gid')
    assert.equal(store.get('ajs_group_id'), 'gid')
  })

  it('id() should not persist when persist disabled', () => {
    const setCookieSpy = jest.spyOn(jar, 'set')

    const group = new Group({ persist: false })
    group.id('gid')

    expect(group.id()).toBe('gid')
    expect(jar.get('ajs_group_id')).toBeFalsy()
    expect(store.get('ajs_group_id')).toBeFalsy()
    expect(ignoreProbeCookieWrites(setCookieSpy).length).toBe(0)
  })

  it('behaves the same as user', () => {
    const user = new User()
    const group = new Group()

    user.id('uid')
    group.id('gid')

    expect(user.id()).toEqual('uid')
    expect(group.id()).toEqual('gid')
  })

  it('always ignores anonymous ids', () => {
    const group = new Group()
    expect(group.anonymousId()).toBeUndefined()

    group.anonymousId('bla')
    expect(group.anonymousId()).toBeUndefined()
  })

  it('uses a different cookie from user', () => {
    const group = new Group()
    group.id('gid')

    expect(jar.get(group.options.cookie?.key ?? '')).toEqual('gid')
    expect(jar.get(User.defaults.cookie.key)).not.toEqual('gid')
  })

  it('uses a different local storage key', () => {
    const group = new Group()
    group.identify('gid', { coolkids: true })

    expect(store.get(group.options.localStorage?.key ?? '')).toEqual({
      coolkids: true,
    })
    expect(store.get(User.defaults.localStorage.key)).not.toEqual({
      coolkids: true,
    })
  })

  describe('when disabled', () => {
    let group: Group
    beforeEach(() => {
      group = new Group({ disable: true })
    })

    it('id should always be null', () => {
      expect(group.id()).toBeNull()
      expect(group.id('foo')).toBeNull()
      expect(group.id()).toBeNull()
    })

    it('traits should always be undefined', () => {
      expect(group.traits()).toBeUndefined()
      expect(group.traits({})).toBeUndefined()
      expect(group.traits()).toBeUndefined()
    })
  })

  describe('#options', () => {
    it('should set options with defaults', function () {
      const group = new Group()
      expect(group.options).toEqual({
        persist: true,
        cookie: {
          key: 'ajs_group_id',
        },
        localStorage: {
          key: 'ajs_group_properties',
        },
      })
    })
  })
})

describe('store', function () {
  describe('#get', function () {
    it('should return null if localStorage throws an error (or does not exist)', function () {
      const getItemSpy = jest
        .spyOn(global.Storage.prototype, 'getItem')
        .mockImplementationOnce(() => {
          throw new Error('getItem fail.')
        })
      store.set('foo', 'some value')
      expect(store.get('foo')).toBeNull()
      expect(getItemSpy).toBeCalledTimes(1)
    })

    it('should not get an empty record', function () {
      expect(store.get('abc')).toBe(null)
    })

    it('should get an existing record', function () {
      store.set('x', { a: 'b' })
      store.set('a', 'hello world')
      store.set('b', '')
      store.set('c', false)
      store.set('d', null)
      store.set('e', undefined)

      expect(store.get('x')).toStrictEqual({ a: 'b' })
      expect(store.get('a')).toBe('hello world')
      expect(store.get('b')).toBe('')
      expect(store.get('c')).toBe(false)
      expect(store.get('d')).toBe(null)
      expect(store.get('e')).toBe('undefined')
    })
  })

  describe('#set', function () {
    it('should be able to set a record', function () {
      store.set('x', { a: 'b' })
      expect(store.get('x')).toStrictEqual({ a: 'b' })
    })

    it('should catch localStorage quota exceeded errors', () => {
      const val = 'x'.repeat(10 * 1024 * 1024)
      store.set('foo', val)

      expect(store.get('foo')).toBe(null)
    })
  })

  describe('#remove', function () {
    it('should be able to remove a record', function () {
      store.set('x', { a: 'b' })
      expect(store.get('x')).toStrictEqual({ a: 'b' })
      store.remove('x')
      expect(store.get('x')).toBe(null)
    })
  })
})

describe('Custom cookie params', () => {
  it('allows for overriding keys', () => {
    const customUser = new User(
      {},
      {
        maxage: 200,
        path: '/',
        sameSite: 'Lax',
      }
    )
    customUser.identify('some_id', { trait: true })

    expect(document.cookie).toMatchInlineSnapshot(`"; ajs_user_id=some_id"`)
    expect(customUser.id()).toBe('some_id')
    expect(customUser.traits()).toEqual({ trait: true })
  })
})

describe('universal storage', function () {
  const defaultTargets = ['cookie', 'localStorage', 'memory'] as StoreType[]
  const getFromLS = (key: string) => JSON.parse(localStorage.getItem(key) ?? '')
  beforeEach(function () {
    clear()
  })

  describe('#get', function () {
    it('picks data from cookies first', function () {
      jar.set('ajs_test_key', '🍪')
      localStorage.setItem('ajs_test_key', '💾')
      const us = new UniversalStorage(
        defaultTargets,
        getAvailableStorageOptions()
      )
      expect(us.get('ajs_test_key')).toEqual('🍪')
    })

    it('picks data from localStorage if there is no cookie target', function () {
      jar.set('ajs_test_key', '🍪')
      localStorage.setItem('ajs_test_key', '💾')
      const us = new UniversalStorage(
        ['localStorage', 'memory'],
        getAvailableStorageOptions()
      )
      expect(us.get('ajs_test_key')).toEqual('💾')
    })

    it('get data from memory', function () {
      jar.set('ajs_test_key', '🍪')
      localStorage.setItem('ajs_test_key', '💾')
      const us = new UniversalStorage(['memory'], getAvailableStorageOptions())
      expect(us.get('ajs_test_key')).toBeNull()
    })

    it('order of default targets matters!', function () {
      jar.set('ajs_test_key', '🍪')
      localStorage.setItem('ajs_test_key', '💾')
      const us = new UniversalStorage(
        ['cookie', 'localStorage', 'memory'],
        getAvailableStorageOptions()
      )
      expect(us.get('ajs_test_key')).toEqual('🍪')
    })

    it('returns null if there are no storage targets', function () {
      jar.set('ajs_test_key', '🍪')
      localStorage.setItem('ajs_test_key', '💾')
      const us = new UniversalStorage([], getAvailableStorageOptions())
      expect(us.get('ajs_test_key')).toBeNull()
    })

    it('can override the default targets', function () {
      jar.set('ajs_test_key', '🍪')
      localStorage.setItem('ajs_test_key', '💾')
      const us = new UniversalStorage(
        defaultTargets,
        getAvailableStorageOptions()
      )
      expect(us.get('ajs_test_key', ['localStorage'])).toEqual('💾')
      expect(us.get('ajs_test_key', ['localStorage', 'memory'])).toEqual('💾')
      expect(us.get('ajs_test_key', ['cookie', 'memory'])).toEqual('🍪')
      expect(us.get('ajs_test_key', ['cookie', 'localStorage'])).toEqual('🍪')
      expect(us.get('ajs_test_key', ['cookie'])).toEqual('🍪')
      expect(us.get('ajs_test_key', ['memory'])).toEqual(null)
    })
  })

  describe('#set', function () {
    it('set the data in all storage types', function () {
      const us = new UniversalStorage<{ ajs_test_key: string }>(
        defaultTargets,
        getAvailableStorageOptions()
      )
      us.set('ajs_test_key', '💰')
      expect(jar.get('ajs_test_key')).toEqual('💰')
      expect(getFromLS('ajs_test_key')).toEqual('💰')
    })

    it('skip saving data to localStorage', function () {
      const us = new UniversalStorage(
        ['cookie', 'memory'],
        getAvailableStorageOptions()
      )
      us.set('ajs_test_key', '💰')
      expect(jar.get('ajs_test_key')).toEqual('💰')
      expect(localStorage.getItem('ajs_test_key')).toEqual(null)
    })

    it('skip saving data to cookie', function () {
      const us = new UniversalStorage(
        ['localStorage', 'memory'],
        getAvailableStorageOptions()
      )
      us.set('ajs_test_key', '💰')
      expect(jar.get('ajs_test_key')).toEqual(undefined)
      expect(getFromLS('ajs_test_key')).toEqual('💰')
    })

    it('can save and retrieve from memory when there is no other storage', function () {
      const us = new UniversalStorage(['memory'], getAvailableStorageOptions())
      us.set('ajs_test_key', '💰')
      expect(jar.get('ajs_test_key')).toEqual(undefined)
      expect(localStorage.getItem('ajs_test_key')).toEqual(null)
      expect(us.get('ajs_test_key')).toEqual('💰')
    })

    it('does not write to cookies when cookies are not available', function () {
      jest.spyOn(Cookie, 'available').mockReturnValueOnce(false)
      const us = new UniversalStorage(
        ['localStorage', 'cookie', 'memory'],
        getAvailableStorageOptions()
      )
      us.set('ajs_test_key', '💰')
      expect(jar.get('ajs_test_key')).toEqual(undefined)
      expect(getFromLS('ajs_test_key')).toEqual('💰')
      expect(us.get('ajs_test_key')).toEqual('💰')
    })

    it('does not write to LS when LS is not available', function () {
      jest.spyOn(LocalStorage, 'available').mockReturnValueOnce(false)
      const us = new UniversalStorage(
        ['localStorage', 'cookie', 'memory'],
        getAvailableStorageOptions()
      )
      us.set('ajs_test_key', '💰')
      expect(jar.get('ajs_test_key')).toEqual('💰')
      expect(localStorage.getItem('ajs_test_key')).toEqual(null)
      expect(us.get('ajs_test_key')).toEqual('💰')
    })

    it('can override the default targets', function () {
      const us = new UniversalStorage(
        defaultTargets,
        getAvailableStorageOptions()
      )
      us.set('ajs_test_key', '💰', ['localStorage'])
      expect(jar.get('ajs_test_key')).toEqual(undefined)
      expect(getFromLS('ajs_test_key')).toEqual('💰')
      expect(us.get('ajs_test_key')).toEqual('💰')

      us.set('ajs_test_key_2', '🦴', ['cookie'])
      expect(jar.get('ajs_test_key_2')).toEqual('🦴')
      expect(localStorage.getItem('ajs_test_key_2')).toEqual(null)
      expect(us.get('ajs_test_key_2')).toEqual('🦴')

      us.set('ajs_test_key_3', '👻', [])
      expect(jar.get('ajs_test_key_3')).toEqual(undefined)
      expect(localStorage.getItem('ajs_test_key_3')).toEqual(null)
      expect(us.get('ajs_test_key_3')).toEqual(null)
    })
  })
})
