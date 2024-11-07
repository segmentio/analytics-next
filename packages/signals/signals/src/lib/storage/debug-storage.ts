export class DebugStorage {
  private storageType: 'localStorage' | 'sessionStorage'
  constructor(type: 'localStorage' | 'sessionStorage') {
    this.storageType = type
  }
  public setDebugKey = (key: string, enable: boolean): void => {
    try {
      if (enable) {
        window[this.storageType].setItem(key, 'true')
      } else {
        window.sessionStorage.removeItem(key)
      }
    } catch (e) {
      console.warn('Storage error', e)
    }
  }

  public getDebugKey = (key: string): boolean => {
    try {
      const isEnabled = Boolean(window[this.storageType].getItem(key))
      if (isEnabled) {
        return true
      }
    } catch (e) {
      console.warn('Storage error', e)
    }
    return false
  }
}
