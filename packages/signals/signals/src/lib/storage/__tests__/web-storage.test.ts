import { WebStorage } from '../web-storage'

describe('WebStorage', () => {
  let webStorage: WebStorage

  beforeEach(() => {
    webStorage = new WebStorage(sessionStorage)
  })
  afterEach(() => {
    sessionStorage.clear()
  })
  describe('getItem, setItem', () => {
    it('should retrieve and parse a stored value from storage', () => {
      const key = 'testKey'
      const value = { foo: 'bar' }

      webStorage.setItem(key, value)

      const result = webStorage.getItem<typeof value>(key)

      expect(result).toEqual(value)
    })

    it('should return undefined if the key does not exist in storage', () => {
      const key = 'nonexistentKey'

      const result = webStorage.getItem(key)
      expect(result).toBeUndefined()
    })

    it('should handle JSON parsing errors gracefully', () => {
      const key = 'testKey'
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      // if somehow invalid JSON is stored in the storage
      sessionStorage.setItem(key, 'invalid JSON')

      const result = webStorage.getItem(key)

      expect(result).toBeUndefined()
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Storage error',
        expect.any(SyntaxError)
      )

      consoleWarnSpy.mockRestore()
    })
  })
})
