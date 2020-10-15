import uuid from '@lukeed/uuid'
import jar from 'js-cookie'

export type ID = string | null | undefined

interface UserOptions {
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
}

export class Cookie extends Store {
  static available(): boolean {
    let cookieEnabled = navigator.cookieEnabled

    if (!cookieEnabled) {
      jar.set('ajs:cookies', 'test')
      cookieEnabled = document.cookie.includes('ajs:cookies')
      jar.remove('ajs:cookies')
    }

    return cookieEnabled
  }

  get<T>(key: string): T | null {
    return jar.getJSON(key)
  }

  set<T>(key: string, value: T): T | null {
    if (typeof value === 'string') {
      jar.set(key, value)
    } else if (value === null) {
      jar.remove(key)
    } else {
      jar.set(key, JSON.stringify(value))
    }
    return value
  }

  remove(key: string): void {
    return jar.remove(key)
  }
}

class NullStorage extends Store {
  get = (_key: string): null => null
  set = (_key: string, _val: unknown): null => null
  remove = (_key: string): void => {}
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
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : null
  }

  set<T>(key: string, value: T): T | null {
    localStorage.setItem(key, JSON.stringify(value))
    return value
  }

  remove(key: string): void {
    return localStorage.removeItem(key)
  }
}

export class User {
  static defaults = defaults

  private cookies: Cookie
  private localStorage: LocalStorage
  private mem = new Store()

  private idKey: string
  private traitsKey: string
  private anonKey: string

  options: UserOptions = {}

  constructor(options: UserOptions = defaults) {
    this.options = options

    this.idKey = options.cookie?.key ?? defaults.cookie.key
    this.traitsKey = options.localStorage?.key ?? defaults.localStorage.key
    this.anonKey = 'ajs_anonymous_id'

    const shouldPersist = options.persist !== false

    this.localStorage =
      options.localStorageFallbackDisabled || !shouldPersist || !LocalStorage.available() ? new NullStorage() : new LocalStorage()

    this.cookies = shouldPersist && Cookie.available() ? new Cookie() : new NullStorage()

    const legacyUser = this.cookies.get<{ id?: string; traits?: object }>(defaults.cookie.oldKey)
    if (legacyUser) {
      legacyUser.id && this.id(legacyUser.id)
      legacyUser.traits && this.traits(legacyUser.traits)
    }
  }

  private chainGet<T>(key: string): T | null {
    const val = this.localStorage.get(key) ?? this.cookies.get(key) ?? this.mem.get(key) ?? null
    return this.trySet(key, val) as T | null
  }

  private trySet<T>(key: string, value: T): T | null {
    this.localStorage.set(key, value)
    this.cookies.set(key, value)
    this.mem.set(key, value)
    return value
  }

  private chainClear(key: string): void {
    this.localStorage.remove(key)
    this.cookies.remove(key)
    this.mem.remove(key)
  }

  id(id?: ID): ID {
    const prevId = this.chainGet(this.idKey)

    if (id !== undefined) {
      this.trySet(this.idKey, id)

      const changingIdentity = id !== prevId && prevId !== null && id !== null
      if (changingIdentity) {
        this.anonymousId(null)
      }
    }

    return this.chainGet(this.idKey) ?? this.cookies.get(defaults.cookie.oldKey) ?? null
  }

  private legacySIO(): [string, string] | null {
    const val = this.cookies.get('_sio') as string
    if (!val) {
      return null
    }
    const [anon, user] = val.split('----')
    return [anon, user]
  }

  anonymousId(id?: ID): ID {
    if (id === undefined) {
      const val = this.chainGet<ID>(this.anonKey) ?? this.legacySIO()?.[0]

      if (val) {
        return val
      }
    }

    if (id === null) {
      this.trySet(this.anonKey, null)
      return this.chainGet(this.anonKey)
    }

    this.trySet(this.anonKey, id ?? uuid())
    return this.chainGet(this.anonKey)
  }

  // TODO: should traits be stored in cookies?
  traits(traits?: object | null): object {
    if (traits === null) {
      traits = {}
    }

    if (traits) {
      this.trySet(this.traitsKey, traits ?? {})
    }

    return this.chainGet(this.traitsKey) ?? {}
  }

  identify(id?: ID, traits?: object): void {
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
    this.chainClear(this.idKey)
    this.chainClear(this.anonKey)
    this.chainClear(this.traitsKey)
  }

  load(): User {
    return new User(this.options)
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
  constructor(options: UserOptions = groupDefaults) {
    super(options)
  }

  anonymousId(_id?: ID): ID {
    return undefined
  }
}
