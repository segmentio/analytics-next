export class WebStorage {
  private storage: Storage
  constructor(storage: Storage) {
    this.storage = storage
  }

  public setItem = (key: string, value: string | boolean): void => {
    try {
      this.storage.setItem(key, value.toString())
    } catch (e) {
      console.warn('Storage error', e)
    }
  }

  public getItem = <T>(key: string): T | undefined => {
    try {
      return (this.storage.getItem(key) as T) ?? undefined
    } catch (e) {
      console.warn('Storage error', e)
    }
    return undefined
  }
}
