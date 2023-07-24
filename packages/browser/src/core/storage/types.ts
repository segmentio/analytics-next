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
export interface Storage<Data extends StorageObject = StorageObject> {
  /**
   * Returns the kind of storage.
   * @example cookie, localStorage, custom
   */
  get type(): StoreType | string

  /**
   * Tests if the storage is available for use in the current environment
   */
  get available(): boolean
  /**
   * get value for the key from the stores. it will return the first value found in the stores
   * @param key key for the value to be retrieved
   * @returns value for the key or null if not found
   */
  get<K extends keyof Data>(key: K): Data[K] | null
  /*
    This is to support few scenarios where:
    - value exist in one of the stores ( as a result of other stores being cleared from browser ) and we want to resync them
    - read values in AJS 1.0 format ( for customers after 1.0 --> 2.0 migration ) and then re-write them in AJS 2.0 format
  */

  /**
   * get value for the key from the stores. it will pick the first value found in the stores, and then sync the value to all the stores
   * if the found value is a number, it will be converted to a string. this is to support legacy behavior that existed in AJS 1.0
   * @param key key for the value to be retrieved
   * @returns value for the key or null if not found
   */
  getAndSync<K extends keyof Data>(key: K): Data[K] | null
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
  clear<K extends keyof Data>(key: K): void
}

/**
 * Abstract class for creating basic storage systems
 */
export abstract class BaseStorage<Data extends StorageObject = StorageObject>
  implements Storage<Data>
{
  abstract get type(): StoreType | string
  abstract get available(): boolean
  abstract get<K extends keyof Data>(key: K): Data[K] | null
  abstract set<K extends keyof Data>(key: K, value: Data[K] | null): void
  abstract clear<K extends keyof Data>(key: K): void
  /**
   * By default a storage getAndSync will handle calls exactly as a normal get.
   * getAndSync needs to be implemented for more complex storage types that might wrap several base storage systems (see UniversalStorage)
   */
  getAndSync<K extends keyof Data>(key: K): Data[K] | null {
    const val = this.get(key)
    // legacy behavior, getAndSync can change the type of a value from number to string (AJS 1.0 stores numerical values as a number)
    const coercedValue = (typeof val === 'number' ? val.toString() : val) as
      | Data[K]
      | null
    return coercedValue
  }
}

export interface StoreTypeWithSettings<T extends StoreType = StoreType> {
  name: T
  settings?: T extends StoreType.Cookie ? CookieOptions : never
}

export type InitializeStorageArgs = (StoreTypeWithSettings | StoreType)[]
