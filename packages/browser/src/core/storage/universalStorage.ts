import { Store, StorageObject } from './types'
import { CookieStorage } from './cookieStorage'

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

  private safeGet<K extends keyof Data>(
    store: Store,
    key: K
  ): Data[K] | null | undefined {
    try {
      return store.get(key) as Data[K] | null
    } catch (e) {
      _logStoreKeyError(store, 'get', key, e)
      return undefined
    }
  }

  // like getAndSync, but a CookieStorage value wins a disagreement, since only it can carry a value across subdomains (see #706)
  getConsistent<K extends keyof Data>(key: K): Data[K] | null {
    // an empty string counts as absent too, so a blanked-but-not-deleted cookie can't win
    const present = this.stores
      .map((store) => ({ store, val: this.safeGet<K>(store, key) }))
      .filter(({ val }) => val !== undefined && val !== null && val !== '')

    const winner =
      present.find(({ store }) => store instanceof CookieStorage)?.val ??
      present[0]?.val ??
      null

    // legacy behavior, matches getAndSync: coerces AJS 1.0's numeric values to a string
    const coercedValue = (
      typeof winner === 'number' ? winner.toString() : winner
    ) as Data[K] | null

    this.set(key, coercedValue)

    return coercedValue
  }
}
