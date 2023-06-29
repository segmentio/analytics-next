import { CustomHTTPClient } from '../../lib/customhttpclient'

export const createSuccess = (body?: any) => {
  return Promise.resolve({
    json: () => Promise.resolve(body),
    ok: true,
    status: 200,
    statusText: 'OK',
  }) as Promise<Response>
}

export const createError = (overrides: Partial<Response> = {}) => {
  return Promise.resolve({
    ok: false,
    status: 404,
    statusText: 'Not Found',
    ...overrides,
  }) as Promise<Response>
}

export class TestFetchClient implements CustomHTTPClient {
  public callCount = 0

  public calls = <any[]>[]
  get lastCall() {
    return this.calls.slice(-1)[0]
  }

  private _returnValue: any
  set returnValue(value: any) {
    this._returnValue = value
  }

  private _errorValue: any
  set errorValue(value: any) {
    this._errorValue = value
  }

  public reset() {
    this.callCount = 0
    this.calls = []
    this._returnValue = null
    this._errorValue = null
  }

  send = async (_resource: any, _options: any): Promise<Response> => {
    this.calls.push([_resource, _options])
    this.callCount++
    if (this._errorValue) {
      throw this._errorValue
    }
    if (this._returnValue) {
      return this._returnValue
    }
    return createSuccess()
  }
}
