import jar from 'js-cookie'
const throwDisabledError = () => {
  throw new Error('__sorry brah, this storage is disabled__')
}
/**
 * Disables Cookies
 * @returns jest spy
 */
export function disableCookies(): void {
  jest.spyOn(window.navigator, 'cookieEnabled', 'get').mockReturnValue(false)
  jest.spyOn(jar, 'set').mockImplementation(throwDisabledError)
  jest.spyOn(jar, 'get').mockImplementation(throwDisabledError)
}

/**
 * Disables LocalStorage
 * @returns jest spy
 */
export function disableLocalStorage(): void {
  jest
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(throwDisabledError)
  jest
    .spyOn(Storage.prototype, 'getItem')
    .mockImplementation(throwDisabledError)
}
