import { CookieOptions } from './cookieStorage'

/**
 * Known Storage Types
 *
 * Convenience settings for storage systems that AJS includes support for
 */
export enum StoreType {
  Cookie = 'cookie',
  LocalStorage = 'localStorage',
  Memory = 'memory',
}

export type StorageObject = Record<string, unknown>

/**
 * Defines a Storage object for use in AJS Client.
 */
export interface Store<Data extends StorageObject = StorageObject> {
  /**
   * get value for the key from the stores. it will return the first value found in the stores
   * @param key key for the value to be retrieved
   * @returns value for the key or null if not found
   */
  get<K extends keyof Data>(key: K): Data[K] | null

  /**
   * it will set the value for the key in all the stores
   * @param key key for the value to be stored
   * @param value value to be stored
   * @returns value that was stored
   */
  set<K extends keyof Data>(key: K, value: Data[K] | null): void
  /**
   * remove the value for the key from all the stores
   * @param key key for the value to be removed
   * @param storeTypes optional array of store types to be used for removing the value
   */
  remove<K extends keyof Data>(key: K): void
}

export interface StoreTypeWithSettings<T extends StoreType = StoreType> {
  name: T
  settings?: T extends StoreType.Cookie ? CookieOptions : never
}

export type InitializeStorageArgs = (StoreTypeWithSettings | StoreType)[]
