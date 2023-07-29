import { StorageObject, Store } from './types'

/**
 * Data storage using browser's localStorage
 */
export class LocalStorage<Data extends StorageObject = StorageObject>
  implements Store<Data>
{
  private localStorageWarning(key: keyof Data, state: 'full' | 'unavailable') {
    console.warn(`Unable to access ${key}, localStorage may be ${state}`)
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

  remove<K extends keyof Data>(key: K): void {
    try {
      return localStorage.removeItem(key)
    } catch (err) {
      this.localStorageWarning(key, 'unavailable')
    }
  }
}
