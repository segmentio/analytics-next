import { LocalStorage } from '../localStorage'

describe('LocalStorage', function () {
  let store: LocalStorage

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {}) // silence console spam.
    store = new LocalStorage()
  })

  afterEach(() => {
    localStorage.clear()
  })

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

  describe('#clear', function () {
    it('should be able to remove a record', function () {
      store.set('x', { a: 'b' })
      expect(store.get('x')).toStrictEqual({ a: 'b' })
      store.clear('x')
      expect(store.get('x')).toBe(null)
    })
  })
})
