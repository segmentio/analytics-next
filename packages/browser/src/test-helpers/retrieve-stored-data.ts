import cookie from 'js-cookie'

export interface RetrieveStoredDataProps {
  cookieNames: string[]
  localStorageKeys: string[]
}

export function retrieveStoredData({
  cookieNames,
  localStorageKeys,
}: RetrieveStoredDataProps): Record<string, string | {}> {
  const result: ReturnType<typeof retrieveStoredData> = {}

  const cookies = cookie.get()
  cookieNames.forEach((name) => {
    if (name in cookies) {
      result[name] = cookies[name]
    }
  })

  localStorageKeys.forEach((key) => {
    const value = localStorage.getItem(key)
    if (value !== null && typeof value !== 'undefined') {
      result[key] = JSON.parse(value)
    }
  })

  return result
}
