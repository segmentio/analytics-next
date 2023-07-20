import { BaseStorage, StorageObject, StoreType } from './types'

/**
 * Data storage using browser's localStorage
 */
export class LocalStorage<
  Data extends StorageObject = StorageObject
> extends BaseStorage {
  private localStorageWarning(key: keyof Data, state: 'full' | 'unavailable') {
    console.warn(`Unable to access ${key}, localStorage may be ${state}`)
  }

  get type() {
    return StoreType.LocalStorage
  }

  get available(): boolean {
    const test = 'test'
    try {
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  }

  get<K extends keyof Data>(key: K): Data[K] | null {
    try {
      const val = localStorage.getItem(key)
      if (val === null) {
        return null
      }
      try {
        return JSON.parse(val) ?? null
      } catch (e) {
        return (val ?? null) as unknown as Data[K] | null
      }
    } catch (err) {
      this.localStorageWarning(key, 'unavailable')
      return null
    }
  }

  set<K extends keyof Data>(key: K, value: Data[K] | null): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      this.localStorageWarning(key, 'full')
    }
  }

  clear<K extends keyof Data>(key: K): void {
    try {
      return localStorage.removeItem(key)
    } catch (err) {
      this.localStorageWarning(key, 'unavailable')
    }
  }
}
