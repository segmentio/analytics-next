import uuid from '@lukeed/uuid'

export type ID = string | null | undefined

// TODO: add storage support
export class User {
  private _id: ID
  private _anonymousId: ID
  private _traits: object | undefined

  id(id?: ID): ID {
    if (id !== undefined) {
      this._id = id
      this.anonymousId(null)
    }

    return this._id
  }

  anonymousId(id?: ID): ID {
    this._anonymousId = id ?? uuid()
    return this._anonymousId
  }

  traits(traits?: object): object {
    this._traits = traits ?? {}
    return this._traits
  }

  identify(id?: ID, traits?: object): void {
    traits = traits ?? {}
    const currentId = this.id()

    if (currentId === null || currentId === id) {
      traits = {
        ...this.traits(),
        ...traits,
      }
    }

    if (id) {
      this.id(id)
    }

    this.traits(traits)
    this.save()
  }

  logout(): void {
    this.anonymousId(null)
    this.id(null)
    this.traits({})
  }

  reset(): void {
    this.logout()
  }

  load(): User {
    return this
  }

  save(): boolean {
    // save to storage
    return true
  }
}
