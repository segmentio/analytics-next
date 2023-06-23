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
  private _returnValue: any
  set returnValue(value: any) {
    this._returnValue = value
  }
  send = async (_resource: any, _options: any): Promise<Response> => {
    return this._returnValue
  }
}
