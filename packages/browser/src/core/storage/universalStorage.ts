import { Store, StorageObject } from './types'

// not adding to private method because those method names do not get minified atm, and does not use 'this'
const _logStoreKeyError = (
  store: Store,
  action: 'set' | 'get' | 'remove',
  key: string,
  err: unknown
) => {
  console.warn(
    `${store.constructor.name}: Can't ${action} key "${key}" | Err: ${err}`
  )
}

/**
 * Uses multiple storages in a priority list to get/set values in the order they are specified.
 */
export class UniversalStorage<Data extends StorageObject = StorageObject> {
  private stores: Store[]

  constructor(stores: Store[]) {
    this.stores = stores
  }

  get<K extends keyof Data>(key: K): Data[K] | null {
    let val: Data[K] | null = null

    for (const store of this.stores) {
      try {
        val = store.get(key) as Data[K] | null
        if (val !== undefined && val !== null) {
          return val
        }
      } catch (e) {
        _logStoreKeyError(store, 'get', key, e)
      }
    }
    return null
  }

  set<K extends keyof Data>(key: K, value: Data[K] | null): void {
    this.stores.forEach((store) => {
      try {
        store.set(key, value)
      } catch (e) {
        _logStoreKeyError(store, 'set', key, e)
      }
    })
  }

  clear<K extends keyof Data>(key: K): void {
    this.stores.forEach((store) => {
      try {
        store.remove(key)
      } catch (e) {
        _logStoreKeyError(store, 'remove', key, e)
      }
    })
  }

  /*
    This is to support few scenarios where:
    - value exist in one of the stores ( as a result of other stores being cleared from browser ) and we want to resync them
    - read values in AJS 1.0 format ( for customers after 1.0 --> 2.0 migration ) and then re-write them in AJS 2.0 format
  */
  getAndSync<K extends keyof Data>(key: K): Data[K] | null {
    const val = this.get(key)

    // legacy behavior, getAndSync can change the type of a value from number to string (AJS 1.0 stores numerical values as a number)
    const coercedValue = (typeof val === 'number' ? val.toString() : val) as
      | Data[K]
      | null

    this.set(key, coercedValue)

    return coercedValue
  }
}
