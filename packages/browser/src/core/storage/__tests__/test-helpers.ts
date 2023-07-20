/**
 * Disables Cookies
 * @returns jest spy
 */
export function disableCookies(): jest.SpyInstance {
  return jest
    .spyOn(window.navigator, 'cookieEnabled', 'get')
    .mockReturnValue(false)
}

/**
 * Disables LocalStorage
 * @returns jest spy
 */
export function disableLocalStorage(): jest.SpyInstance {
  return jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error()
  })
}
