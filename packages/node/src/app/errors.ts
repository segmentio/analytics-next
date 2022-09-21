import { CoreContext } from '@segment/analytics-core'
import { Response } from 'node-fetch'

export interface UnknownError {
  message: string
  ctx: CoreContext
  code: 'unknown'
}

export interface HTTPError {
  message: string
  ctx: CoreContext
  code: 'http_delivery'
  response: Response
}

export type EmittedError = HTTPError | UnknownError
