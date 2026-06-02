import { Store, StorageObject } from './types'

/**
 * Data Storage using in memory object
 */
export class MemoryStorage<Data extends StorageObject = StorageObject>
  implements Store<Data>
{
  private cache: Record<string, unknown> = {}

  get<K extends keyof Data>(key: K): Data[K] | null {
    return (this.cache[String(key)] ?? null) as Data[K] | null
  }

  set<K extends keyof Data>(key: K, value: Data[K] | null): void {
    this.cache[String(key)] = value
  }

  remove<K extends keyof Data>(key: K): void {
    delete this.cache[String(key)]
  }
}
