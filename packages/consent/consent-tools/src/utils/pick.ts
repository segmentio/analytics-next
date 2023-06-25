/**
 * Drop all keys from `categories` that are not in `allKeys`
 */

export const pick = <T extends Record<string, any>>(obj: T, keys: string[]) => {
  return keys.reduce((acc, k) => {
    if (k in obj) {
      ;(acc as any)[k] = obj[k]
    }
    return acc
  }, {} as T)
}
