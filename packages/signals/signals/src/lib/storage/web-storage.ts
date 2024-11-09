export class WebStorage {
  private storage: Storage
  constructor(storage: Storage) {
    this.storage = storage
  }

  /**
   * Set a json-parsable item in storage
   */
  public setItem = <T extends string | number | boolean | object>(
    key: string,
    value: T
  ): void => {
    try {
      const item = JSON.stringify(value)
      this.storage.setItem(key, item)
    } catch (e) {
      console.warn('Storage error', e)
    }
  }

  /**
   * Get a json-parsed item from storage
   */
  public getItem = <T>(key: string): T | undefined => {
    try {
      const item = this.storage.getItem(key)
      if (item === null) {
        return undefined
      }
      return JSON.parse(item) as T
    } catch (e) {
      console.warn('Storage error', e)
    }
    return undefined
  }
}
