import { CookieOptions, CookieStorage } from './cookieStorage'
import { LocalStorage } from './localStorage'
import { MemoryStorage } from './memoryStorage'
import { isStoreTypeWithSettings } from './settings'
import { StoreType, Storage, InitializeStorageArgs } from './types'

export * from './types'
export * from './localStorage'
export * from './cookieStorage'
export * from './memoryStorage'
export * from './universalStorage'
export * from './settings'

/**
 * Creates multiple storage systems from an array of StoreType and options
 * @param args StoreType and options
 * @returns Storage array
 */
export function initializeStorages(args: InitializeStorageArgs): Storage[] {
  const storages = args.map((s) => {
    let type: StoreType
    let settings

    if (isStoreTypeWithSettings(s)) {
      type = s.name
      settings = s.settings
    } else {
      type = s
    }

    switch (type) {
      case StoreType.Cookie:
        return new CookieStorage(settings)
      case StoreType.LocalStorage:
        return new LocalStorage()
      case StoreType.Memory:
        return new MemoryStorage()
      default:
        throw new Error(`Unknown Store Type: ${s}`)
    }
  })
  return storages
}

/**
 * Injects the CookieOptions into a the arguments for initializeStorage
 * @param storeTypes list of storeType
 * @param cookieOptions cookie Options
 * @returns arguments for initializeStorage
 */
export function applyCookieOptions(
  storeTypes: StoreType[],
  cookieOptions?: CookieOptions
): InitializeStorageArgs {
  return storeTypes.map((s) => {
    if (cookieOptions && s === StoreType.Cookie) {
      return {
        name: s,
        settings: cookieOptions,
      }
    }
    return s
  })
}
