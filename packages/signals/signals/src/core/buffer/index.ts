import { Signal } from '../../types'
import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { logger } from '../../lib/logger'

interface SignalDatabase extends DBSchema {
  signals: {
    key: string
    value: Signal
  }
}

export interface SignalPersistentStorage {
  getAll(): Promise<Signal[]> | Signal[]
  add(value: Signal): Promise<void> | void
  clear(): void
}

export class SignalStore implements SignalPersistentStorage {
  static readonly DB_NAME = 'Segment Signals Buffer'
  static readonly STORE_NAME = 'signals'
  private signalStore: Promise<IDBPDatabase<SignalDatabase>>
  private signalCount = 0
  private maxBufferSize: number

  public length() {
    return this.signalCount
  }

  static deleteDatabase() {
    return indexedDB.deleteDatabase(SignalStore.DB_NAME)
  }

  constructor(settings: { maxBufferSize?: number } = {}) {
    this.maxBufferSize = settings.maxBufferSize ?? 50
    this.signalStore = this.createSignalStore()
    void this.initializeSignalCount()
  }

  private getStore() {
    return this.signalStore
  }

  private async createSignalStore() {
    const db = await openDB<SignalDatabase>(SignalStore.DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(SignalStore.STORE_NAME, { autoIncrement: true })
      },
    })
    logger.debug('Signals Buffer (indexDB) initialized')
    return db
  }

  private async initializeSignalCount() {
    const store = await this.signalStore
    this.signalCount = await store.count(SignalStore.STORE_NAME)
    logger.debug(
      `Signal count initialized with ${this.signalCount} signals (max: ${this.maxBufferSize})`
    )
  }

  async add(signal: Signal): Promise<void> {
    const store = await this.signalStore
    if (this.signalCount >= this.maxBufferSize) {
      // Get the key of the oldest signal and delete it
      const oldestKey = await store
        .transaction(SignalStore.STORE_NAME)
        .store.getKey(IDBKeyRange.lowerBound(0))
      if (oldestKey !== undefined) {
        await store.delete(SignalStore.STORE_NAME, oldestKey)
      } else {
        this.signalCount--
      }
    }
    await store.add(SignalStore.STORE_NAME, signal)
    this.signalCount++
  }

  /**
   * Get list of signals from the store, with the newest signals first.
   */
  async getAll(): Promise<Signal[]> {
    const store = await this.getStore()
    return (await store.getAll(SignalStore.STORE_NAME)).reverse()
  }

  async clear() {
    const store = await this.getStore()
    return store.clear(SignalStore.STORE_NAME)
  }
}

export class SignalBuffer<
  T extends SignalPersistentStorage = SignalPersistentStorage
> {
  public store: T
  constructor(store: T) {
    this.store = store
  }
  async add(signal: Signal) {
    try {
      return await this.store.add(signal)
    } catch (e) {
      console.error(e)
      return undefined
    }
  }
  async getAll() {
    try {
      return await this.store.getAll()
    } catch (e) {
      console.error(e)
      return []
    }
  }
  async clear() {
    try {
      return await this.store.clear()
    } catch (e) {
      console.error(e)
      return undefined
    }
  }
}

export interface SignalBufferSettingsConfig<
  T extends SignalPersistentStorage = SignalPersistentStorage
> {
  maxBufferSize?: number
  signalStorage?: T
}
export const getSignalBuffer = <
  T extends SignalPersistentStorage = SignalPersistentStorage
>(
  settings: SignalBufferSettingsConfig<T>
) => {
  const store = settings.signalStorage ?? new SignalStore(settings)
  return new SignalBuffer(store)
}
