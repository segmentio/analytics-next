import { Store, StorageObject } from './types'
import jar from 'js-cookie'
import { tld } from '../user/tld'

const ONE_YEAR = 365

export interface CookieOptions {
  maxage?: number
  domain?: string
  path?: string
  secure?: boolean
  sameSite?: string
}

/**
 * Data storage using browser cookies
 */
export class CookieStorage<Data extends StorageObject = StorageObject>
  implements Store<Data>
{
  static get defaults(): CookieOptions {
    return {
      maxage: ONE_YEAR,
      domain: tld(window.location.href),
      path: '/',
      sameSite: 'Lax',
    }
  }

  private options: Required<CookieOptions>

  constructor(options: CookieOptions = CookieStorage.defaults) {
    this.options = {
      ...CookieStorage.defaults,
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

  get<K extends keyof Data>(key: K): Data[K] | null {
    try {
      const value = jar.get(key)

      if (value === undefined || value === null) {
        return null
      }

      try {
        return JSON.parse(value) ?? null
      } catch (e) {
        return (value ?? null) as unknown as Data[K] | null
      }
    } catch (e) {
      return null
    }
  }

  set<K extends keyof Data>(key: K, value: Data[K] | null): void {
    if (typeof value === 'string') {
      jar.set(key, value, this.opts())
    } else if (value === null) {
      jar.remove(key, this.opts())
    } else {
      jar.set(key, JSON.stringify(value), this.opts())
    }
  }

  remove<K extends keyof Data>(key: K): void {
    return jar.remove(key, this.opts())
  }
}
