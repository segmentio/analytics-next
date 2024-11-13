import { Signal } from '@segment/analytics-signals-runtime'
import { openDB, DBSchema, IDBPDatabase, IDBPObjectStore } from 'idb'
import { logger } from '../../lib/logger'
import { WebStorage } from '../../lib/storage/web-storage'

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

interface IDBPDatabaseSignals extends IDBPDatabase<SignalDatabase> {}
interface IDBPObjectStoreSignals
  extends IDBPObjectStore<
    SignalDatabase,
    ['signals'],
    'signals',
    'readonly' | 'readwrite' | 'versionchange'
  > {}

interface StoreSettings {
  maxBufferSize: number
}
export class SignalStoreIndexDB implements SignalPersistentStorage {
  static readonly DB_NAME = 'Segment Signals Buffer'
  static readonly STORE_NAME = 'signals'
  private db: Promise<IDBPDatabaseSignals>
  private maxBufferSize: number
  private sessionKeyStorage = new WebStorage(window.sessionStorage)
  static deleteDatabase() {
    return indexedDB.deleteDatabase(SignalStoreIndexDB.DB_NAME)
  }

  async getStore(
    permission: IDBTransactionMode,
    database?: IDBPDatabaseSignals
  ): Promise<IDBPObjectStoreSignals> {
    const db = database ?? (await this.db)
    const store = db
      .transaction(SignalStoreIndexDB.STORE_NAME, permission)
      .objectStore(SignalStoreIndexDB.STORE_NAME)
    return store
  }

  constructor(settings: StoreSettings) {
    this.maxBufferSize = settings.maxBufferSize
    this.db = this.initSignalDB()
  }

  private async initSignalDB(): Promise<IDBPDatabaseSignals> {
    const db = await openDB<SignalDatabase>(SignalStoreIndexDB.DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(SignalStoreIndexDB.STORE_NAME, {
          autoIncrement: true,
        })
      },
    })
    logger.debug('Signals Buffer (indexDB) initialized')
    // if the signal buffer is too large, delete the oldest signals (e.g, the settings have changed)
    const store = await this.getStore('readwrite', db)
    await this.clearStoreIfNeeded(store)
    await this.countAndDeleteOldestIfNeeded(store, true)
    await store.transaction.done
    return db
  }

  private async clearStoreIfNeeded(store: IDBPObjectStoreSignals) {
    // prevent the signals buffer from persisting across sessions (e.g, user closes tab and reopens)
    const sessionKey = 'segment_signals_db_session_key'
    if (!sessionStorage.getItem(sessionKey)) {
      this.sessionKeyStorage.setItem(sessionKey, true)
      await store.clear!()
      logger.debug('New Session, so signals buffer cleared')
    }
  }

  async add(signal: Signal): Promise<void> {
    const store = await this.getStore('readwrite')
    await store.add!(signal)
    await this.countAndDeleteOldestIfNeeded(store)
    return store.transaction.done
  }

  private async countAndDeleteOldestIfNeeded(
    store: IDBPObjectStoreSignals,
    deleteMultiple = false
  ): Promise<void> {
    let count = await store.count()
    if (count > this.maxBufferSize) {
      const cursor = await store.openCursor()
      if (cursor) {
        // delete up to maxItems
        if (deleteMultiple) {
          while (count > this.maxBufferSize) {
            await cursor.delete!()
            await cursor.continue()
            count--
          }
          logger.debug(
            `Signals Buffer: Purged signals to max buffer size of ${this.maxBufferSize}`
          )
        } else {
          // just delete the oldest item
          await cursor.delete!()
          count--
        }
      }
    }
  }

  /**
   * Get list of signals from the store, with the newest signals first.
   */
  async getAll(): Promise<Signal[]> {
    const store = await this.getStore('readonly')
    const signals = await store.getAll()
    await store.transaction.done
    return signals.reverse()
  }

  async clear(): Promise<void> {
    const store = await this.getStore('readwrite')
    await store.clear!()
    await store.transaction.done
  }
}

export class SignalStoreSessionStorage implements SignalPersistentStorage {
  private readonly storageKey = 'segment_signals_buffer'
  private maxBufferSize: number

  constructor(settings: StoreSettings) {
    this.maxBufferSize = settings.maxBufferSize
  }

  add(signal: Signal): void {
    const signals = this.getAll()
    signals.unshift(signal)
    if (signals.length > this.maxBufferSize) {
      // delete the last one
      signals.splice(-1)
    }
    sessionStorage.setItem(this.storageKey, JSON.stringify(signals))
  }

  clear(): void {
    sessionStorage.removeItem(this.storageKey)
  }

  getAll(): Signal[] {
    const signals = sessionStorage.getItem(this.storageKey)
    return signals ? JSON.parse(signals) : []
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
  /**
   * Maximum number of signals to store. Only applies if no custom storage implementation is provided.
   */
  maxBufferSize?: number
  /**
   * Choose between sessionStorage and indexDB. Only applies if no custom storage implementation is provided.
   * @default 'indexDB'
   */
  storageType?: 'session' | 'indexDB'
  /**
   * Custom storage implementation
   * @default SignalStoreIndexDB
   */
  signalStorage?: T
}
export const getSignalBuffer = <
  T extends SignalPersistentStorage = SignalPersistentStorage
>(
  settings: SignalBufferSettingsConfig<T>
) => {
  const settingsWithDefaults: StoreSettings = {
    maxBufferSize: 50,
    ...settings,
  }
  const store =
    settings.signalStorage ?? settings.storageType === 'session'
      ? new SignalStoreSessionStorage(settingsWithDefaults)
      : new SignalStoreIndexDB(settingsWithDefaults)
  return new SignalBuffer(store)
}
