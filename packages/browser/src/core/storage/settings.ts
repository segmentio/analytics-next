import { StoreType, StoreTypeWithSettings } from './types'

export type UniversalStorageSettings = { stores: StoreType[] }

// This is setup this way to permit eventually a different set of settings for custom storage
export type StorageSettings = UniversalStorageSettings

export function isArrayOfStoreType(
  s: StorageSettings
): s is UniversalStorageSettings {
  return (
    s &&
    s.stores &&
    Array.isArray(s.stores) &&
    s.stores.every((e) => Object.values(StoreType).includes(e))
  )
}

export function isStoreTypeWithSettings(
  s: StoreTypeWithSettings | StoreType
): s is StoreTypeWithSettings {
  return typeof s === 'object' && s.name !== undefined
}
