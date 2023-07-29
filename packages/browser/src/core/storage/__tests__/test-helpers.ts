import jar from 'js-cookie'
/**
 * Disables Cookies
 * @returns jest spy
 */
export function disableCookies(): void {
  jest.spyOn(window.navigator, 'cookieEnabled', 'get').mockReturnValue(false)
  jest.spyOn(jar, 'set').mockImplementation(() => {
    throw new Error()
  })
  jest.spyOn(jar, 'get').mockImplementation(() => {
    throw new Error()
  })
}

/**
 * Disables LocalStorage
 * @returns jest spy
 */
export function disableLocalStorage(): void {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error()
  })
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error()
  })
}
