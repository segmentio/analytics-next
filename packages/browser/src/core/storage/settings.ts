import { Storage, StoreType, StoreTypeWithSettings } from './types'

export type StorageSettings = Storage | StoreType[]

export function isArrayOfStoreType(s: StorageSettings): s is StoreType[] {
  return (
    s &&
    Array.isArray(s) &&
    s.every((e) => Object.values(StoreType).includes(e))
  )
}

export function isStorageObject(s: StorageSettings): s is Storage {
  return s && !Array.isArray(s) && typeof s === 'object' && s.get !== undefined
}

export function isStoreTypeWithSettings(
  s: StoreTypeWithSettings | StoreType
): s is StoreTypeWithSettings {
  return typeof s === 'object' && s.name !== undefined
}
