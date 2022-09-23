import { CoreContext } from '@segment/analytics-core'
import { Response } from 'node-fetch'

export interface HTTPError {
  message: string
  ctx: CoreContext
  code: 'http_delivery'
  response: Response
}

export type NodeEmittedError = HTTPError
