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

type StorageObject = Record<string, unknown>

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
  get type(): StoreType {
    return 'memory'
  }
}

const ONE_YEAR = 365

export class Cookie extends Store {
  static _available: boolean | undefined
  static available(): boolean {
    if (Cookie._available !== undefined) {
      return Cookie._available
    }

    let cookieEnabled = window.navigator.cookieEnabled

    if (!cookieEnabled) {
      jar.set('ajs:cookies', 'test')
      cookieEnabled = document.cookie.includes('ajs:cookies')
      jar.remove('ajs:cookies')
    }

    Cookie._available = cookieEnabled

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

  get type(): StoreType {
    return 'cookie'
  }
}

const localStorageWarning = (key: string, state: 'full' | 'unavailable') => {
  console.warn(`Unable to access ${key}, localStorage may be ${state}`)
}

export class LocalStorage extends Store {
  static _available: boolean | undefined

  static available(): boolean {
    if (LocalStorage._available !== undefined) {
      return LocalStorage._available
    }

    const test = 'test'
    try {
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      LocalStorage._available = true
      return true
    } catch (e) {
      LocalStorage._available = false
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

  get type(): StoreType {
    return 'localStorage'
  }
}

export interface CookieOptions {
  maxage?: number
  domain?: string
  path?: string
  secure?: boolean
  sameSite?: string
}

export class UniversalStorage<Data extends StorageObject = StorageObject> {
  private stores: Store[]

  constructor(stores?: Store[]) {
    this.stores = stores || []
  }

  private getStores(storeTypes: StoreType[] | undefined): Store[] {
    return storeTypes
      ? this.stores.filter((s) => storeTypes.indexOf(s.type) !== -1)
      : this.stores
  }

  /*
    This is to support few scenarios where:  
    - value exist in one of the stores ( as a result of other stores being cleared from browser ) and we want to resync them 
    - read values in AJS 1.0 format ( for customers after 1.0 --> 2.0 migration ) and then re-write them in AJS 2.0 format
  */
  public getAndSync<K extends keyof Data>(
    key: K,
    storeTypes?: StoreType[]
  ): Data[K] | null {
    const val = this.get(key, storeTypes)

    return this.set(
      key,
      //@ts-ignore TODO: legacy behavior, getAndSync can change the type of a value from number to string (AJS 1.0 stores numerical values as a number)
      typeof val === 'number' ? val.toString() : val,
      storeTypes
    ) as Data[K] | null
  }

  public get<K extends keyof Data>(
    key: K,
    storeTypes?: StoreType[]
  ): Data[K] | null {
    let val = null

    for (const store of this.getStores(storeTypes)) {
      val = store.get<Data[K]>(key)
      if (val) {
        return val
      }
    }
    return null
  }

  public set<K extends keyof Data>(
    key: K,
    value: Data[K] | null,
    storeTypes?: StoreType[]
  ): Data[K] | null {
    for (const store of this.getStores(storeTypes)) {
      store.set(key, value)
    }
    return value
  }

  public clear<K extends keyof Data>(key: K, storeTypes?: StoreType[]): void {
    for (const store of this.getStores(storeTypes)) {
      store.remove(key)
    }
  }

  static getUniversalStorage<T extends Record<string, unknown>>(
    defaultTargets: StoreType[] = ['cookie', 'localStorage', 'memory'],
    cookieOptions?: CookieOptions
  ): UniversalStorage<T> {
    const stores = []

    if (defaultTargets.includes('cookie') && Cookie.available()) {
      stores.push(new Cookie(cookieOptions))
    }

    if (defaultTargets.includes('localStorage') && LocalStorage.available()) {
      stores.push(new LocalStorage())
    }

    if (defaultTargets.includes('memory')) {
      stores.push(new Store())
    }

    return new UniversalStorage<T>(stores)
  }
}

export class User {
  static defaults = defaults

  private idKey: string
  private traitsKey: string
  private anonKey: string
  private cookieOptions?: CookieOptions

  private legacyUserStore: UniversalStorage<{
    [k: string]:
      | {
          id?: string
          traits?: Traits
        }
      | string
  }>
  private traitsStore: UniversalStorage<{
    [k: string]: Traits
  }>

  private identityStore: UniversalStorage<{
    [k: string]: string
  }>

  options: UserOptions = {}

  constructor(options: UserOptions = defaults, cookieOptions?: CookieOptions) {
    this.options = options
    this.cookieOptions = cookieOptions

    this.idKey = options.cookie?.key ?? defaults.cookie.key
    this.traitsKey = options.localStorage?.key ?? defaults.localStorage.key
    this.anonKey = 'ajs_anonymous_id'

    const isDisabled = options.disable === true
    const shouldPersist = options.persist !== false

    let defaultStorageTargets: StoreType[] = isDisabled
      ? []
      : shouldPersist
      ? ['cookie', 'localStorage', 'memory']
      : ['memory']

    if (options.localStorageFallbackDisabled) {
      defaultStorageTargets = defaultStorageTargets.filter(
        (t) => t !== 'localStorage'
      )
    }

    this.identityStore = UniversalStorage.getUniversalStorage(
      defaultStorageTargets,
      cookieOptions
    )

    // using only cookies for legacy user store
    this.legacyUserStore = UniversalStorage.getUniversalStorage(
      defaultStorageTargets.filter(
        (t) => t !== 'localStorage' && t !== 'memory'
      ),
      cookieOptions
    )

    // using only localStorage / memory for traits store
    this.traitsStore = UniversalStorage.getUniversalStorage(
      defaultStorageTargets.filter((t) => t !== 'cookie'),
      cookieOptions
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
