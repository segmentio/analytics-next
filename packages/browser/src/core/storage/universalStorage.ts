import { Storage, StorageObject } from './types'

/**
 * Uses multiple storages in a priority list to get/set values in the order they are specified.
 */
export class UniversalStorage<Data extends StorageObject = StorageObject>
  implements Storage<Data>
{
  private stores: Storage[]

  constructor(stores: Storage[]) {
    this.stores = stores.filter((s) => s.available)
  }

  get available(): boolean {
    return this.stores.some((s) => s.available)
  }

  get type(): string {
    return 'PriorityListStorage'
  }

  get<K extends keyof Data>(key: K): Data[K] | null {
    let val: Data[K] | null = null

    for (const store of this.stores) {
      val = store.get(key) as Data[K] | null
      if (val !== undefined && val !== null) {
        return val
      }
    }
    return null
  }

  set<K extends keyof Data>(key: K, value: Data[K] | null): void {
    this.stores.forEach((s) => s.set(key, value))
  }

  clear<K extends keyof Data>(key: K): void {
    this.stores.forEach((s) => s.clear(key))
  }

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
