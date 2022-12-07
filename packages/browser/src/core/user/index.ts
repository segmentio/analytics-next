import { v4 as uuid } from '@lukeed/uuid'
import jar from 'js-cookie'
import { Traits } from '../events'
import { tld } from './tld'
import autoBind from '../../lib/bind-all'

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

export type StoreType = 'cookie' | 'localStorage' | 'memory'

class Store {
  private cache: Record<string, unknown> = {}

  get<T>(key: string): T | null {
    return this.cache[key] as T | null
  }

  set<T>(key: string, value: T | null): T | null {
    this.cache[key] = value
    return value
  }

  remove(key: string): void {
    delete this.cache[key]
  }

  getType = (): StoreType => 'memory'
}

const ONE_YEAR = 365

export class Cookie extends Store {
  static available(): boolean {
    let cookieEnabled = window.navigator.cookieEnabled

    if (!cookieEnabled) {
      jar.set('ajs:cookies', 'test')
      cookieEnabled = document.cookie.includes('ajs:cookies')
      jar.remove('ajs:cookies')
    }

    return cookieEnabled
  }

  static get defaults(): CookieOptions {
    return {
      maxage: ONE_YEAR,
      domain: tld(window.location.href),
      path: '/',
      sameSite: 'Lax',
    }
  }

  private options: Required<CookieOptions>

  constructor(options: CookieOptions = Cookie.defaults) {
    super()
    this.options = {
      ...Cookie.defaults,
      ...options,
    } as Required<CookieOptions>
  }

  private opts(): jar.CookieAttributes {
    return {
      sameSite: this.options.sameSite as jar.CookieAttributes['sameSite'],
      expires: this.options.maxage,
      domain: this.options.domain,
      path: this.options.path,
      secure: this.options.secure,
    }
  }

  get<T>(key: string): T | null {
    try {
      const value = jar.get(key)

      if (!value) {
        return null
      }

      try {
        return JSON.parse(value)
      } catch (e) {
        return value as unknown as T
      }
    } catch (e) {
      return null
    }
  }

  set<T>(key: string, value: T): T | null {
    if (typeof value === 'string') {
      jar.set(key, value, this.opts())
    } else if (value === null) {
      jar.remove(key, this.opts())
    } else {
      jar.set(key, JSON.stringify(value), this.opts())
    }
    return value
  }

  remove(key: string): void {
    return jar.remove(key, this.opts())
  }

  getType = (): StoreType => 'cookie'
}

const localStorageWarning = (key: string, state: 'full' | 'unavailable') => {
  console.warn(`Unable to access ${key}, localStorage may be ${state}`)
}

export class LocalStorage extends Store {
  static available(): boolean {
    const test = 'test'
    try {
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  }

  get<T>(key: string): T | null {
    try {
      const val = localStorage.getItem(key)
      if (val === null) {
        return null
      }
      try {
        return JSON.parse(val)
      } catch (e) {
        return val as any as T
      }
    } catch (err) {
      localStorageWarning(key, 'unavailable')
      return null
    }
  }

  set<T>(key: string, value: T): T | null {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      localStorageWarning(key, 'full')
    }

    return value
  }

  remove(key: string): void {
    try {
      return localStorage.removeItem(key)
    } catch (err) {
      localStorageWarning(key, 'unavailable')
    }
  }

  getType = (): StoreType => 'localStorage'
}

export interface CookieOptions {
  maxage?: number
  domain?: string
  path?: string
  secure?: boolean
  sameSite?: string
}

export class UniversalStorage {
  private stores: Store[]

  constructor(stores?: Store[]) {
    this.stores = stores || []
  }

  private getStores(storeTypes: StoreType[] | undefined): Store[] {
    return storeTypes
      ? this.stores.filter((s) => storeTypes.indexOf(s.getType()) !== -1)
      : this.stores
  }

  public push(store: Store) {
    this.stores.push(store)
  }

  public getAndSync<T>(key: string, storeTypes?: StoreType[]): T | null {
    const val = this.get(key, storeTypes)

    return this.set(
      key,
      typeof val === 'number' ? val.toString() : val,
      storeTypes
    ) as T | null
  }

  public get<T>(key: string, storeTypes?: StoreType[]): T | null {
    let val = null

    for (const store of this.getStores(storeTypes)) {
      val = store.get<T>(key)
      if (val) {
        return val
      }
    }
    return null
  }

  public set<T>(key: string, value: T, storeTypes?: StoreType[]): T | null {
    for (const store of this.getStores(storeTypes)) {
      store.set(key, value)
    }
    return value
  }

  public clear(key: string, storeTypes?: StoreType[]): void {
    for (const store of this.getStores(storeTypes)) {
      store.remove(key)
    }
  }

  static getUniversalStorage(
    hasBrowserStorage: boolean,
    cookieOptions?: CookieOptions
  ): UniversalStorage {
    const stores = []

    if (hasBrowserStorage && Cookie.available()) {
      stores.push(new Cookie(cookieOptions))
    }

    if (hasBrowserStorage && LocalStorage.available()) {
      stores.push(new LocalStorage())
    }

    stores.push(new Store())

    return new UniversalStorage(stores)
  }
}

export class User {
  static defaults = defaults

  private idKey: string
  private traitsKey: string
  private anonKey: string
  private cookieOptions?: CookieOptions
  private universalStore: UniversalStorage

  private legacyUserStoreTargets: StoreType[] = []
  private traitsStoreTargets: StoreType[] = []
  private identityStoreTypes: StoreType[] = []

  options: UserOptions = {}

  constructor(
    options: UserOptions = defaults,
    cookieOptions?: CookieOptions,
    universalStore?: UniversalStorage
  ) {
    this.options = options
    this.cookieOptions = cookieOptions

    this.idKey = options.cookie?.key ?? defaults.cookie.key
    this.traitsKey = options.localStorage?.key ?? defaults.localStorage.key
    this.anonKey = 'ajs_anonymous_id'

    const isDisabled = options.disable === true
    const shouldPersist = options.persist !== false

    this.universalStore =
      universalStore ||
      UniversalStorage.getUniversalStorage(shouldPersist, cookieOptions)

    if (!isDisabled) {
      this.identityStoreTypes.push('memory', 'cookie')
      this.legacyUserStoreTargets.push('cookie')
      this.traitsStoreTargets.push('memory')
      if (!options.localStorageFallbackDisabled) {
        this.traitsStoreTargets.push('localStorage')
        this.identityStoreTypes.push('localStorage')
      }
    }

    const legacyUser = this.universalStore.get<{
      id?: string
      traits?: Traits
    }>(defaults.cookie.oldKey, this.legacyUserStoreTargets)
    if (legacyUser) {
      legacyUser.id && this.id(legacyUser.id)
      legacyUser.traits && this.traits(legacyUser.traits)
    }
    autoBind(this)
  }

  id = (id?: ID): ID => {
    if (this.options.disable) {
      return null
    }

    const prevId = this.universalStore.getAndSync(
      this.idKey,
      this.identityStoreTypes
    )

    if (id !== undefined) {
      this.universalStore.set(this.idKey, id, this.identityStoreTypes)

      const changingIdentity = id !== prevId && prevId !== null && id !== null
      if (changingIdentity) {
        this.anonymousId(null)
      }
    }

    return (
      this.universalStore.getAndSync(this.idKey, this.identityStoreTypes) ??
      this.universalStore.get(
        defaults.cookie.oldKey,
        this.legacyUserStoreTargets
      ) ??
      null
    )
  }

  private legacySIO(): [string, string] | null {
    const val = this.universalStore.get(
      '_sio',
      this.legacyUserStoreTargets
    ) as string
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
        this.universalStore.getAndSync<ID>(
          this.anonKey,
          this.identityStoreTypes
        ) ?? this.legacySIO()?.[0]

      if (val) {
        return val
      }
    }

    if (id === null) {
      this.universalStore.set(this.anonKey, null, this.identityStoreTypes)
      return this.universalStore.getAndSync(
        this.anonKey,
        this.identityStoreTypes
      )
    }

    this.universalStore.set(this.anonKey, id ?? uuid(), this.identityStoreTypes)
    return this.universalStore.getAndSync(this.anonKey, this.identityStoreTypes)
  }

  traits = (traits?: Traits | null): Traits | undefined => {
    if (this.options.disable) {
      return
    }

    if (traits === null) {
      traits = {}
    }

    if (traits) {
      this.universalStore.set(
        this.traitsKey,
        traits ?? {},
        this.traitsStoreTargets
      )
    }

    return (
      this.universalStore.get(this.traitsKey, this.traitsStoreTargets) ?? {}
    )
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
    this.universalStore.clear(this.idKey, this.identityStoreTypes)
    this.universalStore.clear(this.anonKey, this.identityStoreTypes)
    this.universalStore.clear(this.traitsKey, this.traitsStoreTargets)
  }

  load(): User {
    return new User(this.options, this.cookieOptions)
  }

  save(): boolean {
    return true
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
    super(options, cookie)
    autoBind(this)
  }

  anonymousId = (_id?: ID): ID => {
    return undefined
  }
}
