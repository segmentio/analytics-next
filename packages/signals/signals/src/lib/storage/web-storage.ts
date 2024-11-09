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

  public getItem = (key: string): string | undefined => {
    try {
      return this.storage.getItem(key) ?? undefined
    } catch (e) {
      console.warn('Storage error', e)
    }
    return undefined
  }

  public getBooleanItem = (key: string): boolean | undefined => {
    const item = this.getItem(key)
    return item === 'true' ? true : item === 'false' ? false : undefined
  }
}
