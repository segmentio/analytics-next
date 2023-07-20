import { v4 as uuid } from '@lukeed/uuid'
import autoBind from '../../lib/bind-all'
import { Traits } from '../events'
import {
  CookieOptions,
  UniversalStorage,
  Storage,
  StorageObject,
  StorageSettings,
  StoreType,
  applyCookieOptions,
  initializeStorages,
  isArrayOfStoreType,
  isStorageObject,
} from '../storage'
import { MemoryStorage } from '../storage/memoryStorage'
import {} from '../storage/settings'

export type ID = string | null | undefined

export interface UserOptions {
  /**
   * Disables storing any data about the user.
   */
  disable?: boolean
  localStorageFallbackDisabled?: boolean
  persist?: boolean

  cookie?: {
    key?: string
    oldKey?: string
  }

  localStorage?: {
    key: string
  }

  /**
   * Storage system to use
   * @example new MemoryStorage, [StoreType.Cookie, StoreType.Memory]
   */
  storage?: StorageSettings
}

const defaults = {
  persist: true,
  cookie: {
    key: 'ajs_user_id',
    oldKey: 'ajs_user',
  },
  localStorage: {
    key: 'ajs_user_traits',
  },
}

export class User {
  static defaults = defaults

  private idKey: string
  private traitsKey: string
  private anonKey: string
  private cookieOptions?: CookieOptions

  private legacyUserStore: Storage<{
    [k: string]:
      | {
          id?: string
          traits?: Traits
        }
      | string
  }>
  private traitsStore: Storage<{
    [k: string]: Traits
  }>

  private identityStore: Storage<{
    [k: string]: string
  }>

  options: UserOptions = {}

  constructor(options: UserOptions = defaults, cookieOptions?: CookieOptions) {
    this.options = { ...defaults, ...options }
    this.cookieOptions = cookieOptions

    this.idKey = options.cookie?.key ?? defaults.cookie.key
    this.traitsKey = options.localStorage?.key ?? defaults.localStorage.key
    this.anonKey = 'ajs_anonymous_id'

    this.identityStore = this.createStorage(this.options, cookieOptions)

    // using only cookies for legacy user store
    this.legacyUserStore = this.createStorage(
      this.options,
      cookieOptions,
      (s) => s === StoreType.Cookie
    )

    // using only localStorage / memory for traits store
    this.traitsStore = this.createStorage(
      this.options,
      cookieOptions,
      (s) => s !== StoreType.Cookie
    )

    const legacyUser = this.legacyUserStore.get(defaults.cookie.oldKey)
    if (legacyUser && typeof legacyUser === 'object') {
      legacyUser.id && this.id(legacyUser.id)
      legacyUser.traits && this.traits(legacyUser.traits)
    }
    autoBind(this)
  }

  id = (id?: ID): ID => {
    if (this.options.disable) {
      return null
    }

    const prevId = this.identityStore.getAndSync(this.idKey)

    if (id !== undefined) {
      this.identityStore.set(this.idKey, id)

      const changingIdentity = id !== prevId && prevId !== null && id !== null
      if (changingIdentity) {
        this.anonymousId(null)
      }
    }

    const retId = this.identityStore.getAndSync(this.idKey)
    if (retId) return retId

    const retLeg = this.legacyUserStore.get(defaults.cookie.oldKey)
    return retLeg ? (typeof retLeg === 'object' ? retLeg.id : retLeg) : null
  }

  private legacySIO(): [string, string] | null {
    const val = this.legacyUserStore.get('_sio') as string
    if (!val) {
      return null
    }
    const [anon, user] = val.split('----')
    return [anon, user]
  }

  anonymousId = (id?: ID): ID => {
    if (this.options.disable) {
      return null
    }

    if (id === undefined) {
      const val =
        this.identityStore.getAndSync(this.anonKey) ?? this.legacySIO()?.[0]

      if (val) {
        return val
      }
    }

    if (id === null) {
      this.identityStore.set(this.anonKey, null)
      return this.identityStore.getAndSync(this.anonKey)
    }

    this.identityStore.set(this.anonKey, id ?? uuid())
    return this.identityStore.getAndSync(this.anonKey)
  }

  traits = (traits?: Traits | null): Traits | undefined => {
    if (this.options.disable) {
      return
    }

    if (traits === null) {
      traits = {}
    }

    if (traits) {
      this.traitsStore.set(this.traitsKey, traits ?? {})
    }

    return this.traitsStore.get(this.traitsKey) ?? {}
  }

  identify(id?: ID, traits?: Traits): void {
    if (this.options.disable) {
      return
    }

    traits = traits ?? {}
    const currentId = this.id()

    if (currentId === null || currentId === id) {
      traits = {
        ...this.traits(),
        ...traits,
      }
    }

    if (id) {
      this.id(id)
    }

    this.traits(traits)
  }

  logout(): void {
    this.anonymousId(null)
    this.id(null)
    this.traits({})
  }

  reset(): void {
    this.logout()
    this.identityStore.clear(this.idKey)
    this.identityStore.clear(this.anonKey)
    this.traitsStore.clear(this.traitsKey)
  }

  load(): User {
    return new User(this.options, this.cookieOptions)
  }

  save(): boolean {
    return true
  }

  /**
   * Creates the right storage system applying all the user options, cookie options and particular filters
   * @param options UserOptions
   * @param cookieOpts CookieOptions
   * @param filterStores filter function to apply to any StoreTypes (skipped if options specify using a custom storage)
   * @returns a Storage object
   */
  private createStorage<T extends StorageObject = StorageObject>(
    options: UserOptions,
    cookieOpts?: CookieOptions,
    filterStores?: (value: StoreType) => boolean
  ): Storage<T> {
    let stores: StoreType[] = [
      StoreType.LocalStorage,
      StoreType.Cookie,
      StoreType.Memory,
    ]

    // If disabled we won't have any storage functionality
    if (options.disable) {
      return new UniversalStorage<T>([])
    }

    // If persistance is disabled we will always fallback to Memory Storage
    if (!options.persist) {
      return new MemoryStorage<T>()
    }

    if (options.storage !== undefined && options.storage !== null) {
      // If the user is sending its own storage implementation we will use that without any modifications
      if (isStorageObject(options.storage)) {
        return options.storage as Storage<T>
      } else if (isArrayOfStoreType(options.storage)) {
        // If the user only specified order of stores we will still apply filters and transformations e.g. not using localStorage if localStorageFallbackDisabled
        stores = options.storage
      }
    }

    // Disable LocalStorage
    if (options.localStorageFallbackDisabled) {
      stores = stores.filter((s) => s !== StoreType.LocalStorage)
    }

    // Apply Additional filters
    if (filterStores) {
      stores = stores.filter(filterStores)
    }

    return new UniversalStorage(
      initializeStorages(applyCookieOptions(stores, cookieOpts))
    )
  }
}

const groupDefaults: UserOptions = {
  persist: true,
  cookie: {
    key: 'ajs_group_id',
  },
  localStorage: {
    key: 'ajs_group_properties',
  },
}

export class Group extends User {
  constructor(options: UserOptions = groupDefaults, cookie?: CookieOptions) {
    super({ ...groupDefaults, ...options }, cookie)
    autoBind(this)
  }

  anonymousId = (_id?: ID): ID => {
    return undefined
  }
}
