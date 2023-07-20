import { BaseStorage, StorageObject, StoreType } from './types'

/**
 * Data Storage using in memory object
 */
export class MemoryStorage<
  Data extends StorageObject = StorageObject
> extends BaseStorage<Data> {
  private cache: Record<string, unknown> = {}

  get type() {
    return StoreType.Memory
  }

  get available(): boolean {
    return true
  }

  get<K extends keyof Data>(key: K): Data[K] | null {
    return (this.cache[key] ?? null) as Data[K] | null
  }

  set<K extends keyof Data>(key: K, value: Data[K] | null): void {
    this.cache[key] = value
  }

  clear<K extends keyof Data>(key: K): void {
    delete this.cache[key]
  }
}
