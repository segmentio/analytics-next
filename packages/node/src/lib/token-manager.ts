import { uuid } from './uuid'
import {
  FetchHTTPClient,
  HTTPClient,
  HTTPClientRequest,
  HTTPResponse,
} from './http-client'
import { SignOptions, sign } from 'jsonwebtoken'
import { Emitter, backoff, sleep } from '@segment/analytics-core'
import type {
  AccessToken,
  OAuthSettings,
  TokenManager as ITokenManager,
} from './types'

const isAccessToken = (thing: unknown): thing is AccessToken => {
  return Boolean(
    thing &&
      typeof thing === 'object' &&
      'access_token' in thing &&
      'expires_in' in thing &&
      typeof thing.access_token === 'string' &&
      typeof thing.expires_in === 'number'
  )
}

export class TokenManager implements ITokenManager {
  private alg = 'RS256' as const
  private grantType = 'client_credentials' as const
  private clientAssertionType =
    'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' as const
  private clientId: string
  private clientKey: Buffer
  private keyId: string
  private scope: string
  private authServer: string
  private httpClient: HTTPClient
  private maxRetries: number
  private clockSkewInSeconds = 0

  private accessToken?: AccessToken
  private tokenEmitter = new Emitter<{
    access_token: [{ token: AccessToken } | { error: unknown }]
  }>()
  private retryCount: number
  private lastError: any
  private pollerTimer?: ReturnType<typeof setTimeout>

  constructor(props: OAuthSettings) {
    this.keyId = props.keyId
    this.clientId = props.clientId
    this.clientKey = props.clientKey
    this.authServer = props.authServer ?? 'https://oauth2.segment.io'
    this.scope = props.scope ?? 'tracking_api:write'
    this.httpClient = props.httpClient ?? new FetchHTTPClient()
    this.maxRetries = props.maxRetries ?? 3
    this.tokenEmitter.on('access_token', (event) => {
      if ('token' in event) {
        this.accessToken = event.token
      }
    })
    this.retryCount = 0
  }

  async pollerLoop() {
    let timeUntilRefreshInMs = 25
    let response: HTTPResponse

    try {
      response = await this.requestAccessToken()
    } catch (err) {
      // Error without a status code - likely networking, retry
      this.retryCount++
      this.lastError = err

      if (this.retryCount % this.maxRetries === 0) {
        this.tokenEmitter.emit('access_token', { error: this.lastError })
      }

      this.pollerTimer = setTimeout(
        this.pollerLoop.bind(this),
        backoff({
          attempt: this.retryCount,
          minTimeout: 25,
          maxTimeout: 1000,
        })
      )?.unref()
      return
    }

    if (response.headers !== undefined && response.headers.Date != undefined) {
      try {
        this.clockSkewInSeconds = Date.now() - Date.parse(response.headers.Date)
      } catch (err) {
        // Unable to parse, move on with last or 0 skew
      }
    }

    // Handle status codes!
    if (response.status === 200) {
      let body: any
      if (typeof response.text != 'function') {
        this.tokenEmitter.emit('access_token', {
          error: new Error(
            'HTTPClient does not implement response.text method'
          ),
        })
        return
      }
      try {
        body = await response.text()
      } catch (err) {
        // Errors reading the body (not parsing) are likely networking issues, we can retry
        this.retryCount++
        this.lastError = err
        timeUntilRefreshInMs = backoff({
          attempt: this.retryCount,
          minTimeout: 25,
          maxTimeout: 1000,
        })
        this.pollerTimer = setTimeout(
          this.pollerLoop.bind(this),
          timeUntilRefreshInMs
        )?.unref()
        return
      }
      try {
        const token = JSON.parse(body)

        if (!isAccessToken(token)) {
          throw new Error(
            'Response did not contain a valid access_token and expires_in'
          )
        }

        this.tokenEmitter.emit('access_token', { token })

        // Reset our failure count
        this.retryCount = 0

        // Refresh the token after half the expiry time passes
        timeUntilRefreshInMs = (token.expires_in / 2) * 1000
      } catch (err) {
        // Something went really wrong with the body, lets surface an error and try again?
        this.tokenEmitter.emit('access_token', { error: err })
        this.retryCount = 0 // Reset because we've emitted an error

        timeUntilRefreshInMs = backoff({
          attempt: this.retryCount,
          minTimeout: 25,
          maxTimeout: 1000,
        })
      }
    } else if (response.status === 429) {
      this.retryCount++
      this.lastError = `[${response.status}] ${response.statusText}`
      if (response.headers) {
        const rateLimitResetTimestamp = parseInt(
          response.headers['X-RateLimit-Reset'],
          10
        )
        if (isFinite(rateLimitResetTimestamp)) {
          timeUntilRefreshInMs =
            rateLimitResetTimestamp -
            Date.now() +
            this.clockSkewInSeconds * 1000
        } else {
          timeUntilRefreshInMs = 5 * 1000
        }
        // We want subsequent calls to get_token to be able to interrupt our
        //  Timeout when it's waiting for e.g. a long normal expiration, but
        //  not when we're waiting for a rate limit reset. Sleep instead.
        await sleep(timeUntilRefreshInMs)
        timeUntilRefreshInMs = 0
      }
    } else if ([400, 401, 415].includes(response.status)) {
      // Unrecoverable errors
      this.retryCount = 0
      this.tokenEmitter.emit('access_token', {
        error: new Error(`[${response.status}] ${response.statusText}`),
      })
      this.stopPoller()
      return
    } else {
      this.retryCount++
      this.lastError = new Error(`[${response.status}] ${response.statusText}`)
      timeUntilRefreshInMs = backoff({
        attempt: this.retryCount,
        minTimeout: 25,
        maxTimeout: 1000,
      })
    }

    if (this.retryCount % this.maxRetries === 0) {
      this.tokenEmitter.emit('access_token', { error: this.lastError })
      // TODO: figure out timing and whether to reset retries?
    }
    this.pollerTimer = setTimeout(
      this.pollerLoop.bind(this),
      timeUntilRefreshInMs
    )?.unref()
  }

  stopPoller() {
    clearTimeout(this.pollerTimer)
  }

  /**
   * Solely responsible for building the HTTP request and calling the token service.
   */
  private requestAccessToken(): Promise<HTTPResponse> {
    const jti = uuid()
    const currentUTCInSeconds = Math.round(Date.now() / 1000)
    const jwtBody = {
      iss: this.clientId,
      sub: this.clientId,
      aud: this.authServer,
      iat: currentUTCInSeconds,
      exp: currentUTCInSeconds + 60,
      jti,
    }

    const signingOptions: SignOptions = {
      algorithm: this.alg,
      keyid: this.keyId,
    }

    const signedJwt = sign(jwtBody, this.clientKey, signingOptions)

    const requestBody = `grant_type=${this.grantType}&client_assertion_type=${this.clientAssertionType}&client_assertion=${signedJwt}&scope=${this.scope}`
    const accessTokenEndpoint = `${this.authServer}/token`

    const requestOptions: HTTPClientRequest = {
      method: 'POST',
      url: accessTokenEndpoint,
      body: requestBody,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      httpRequestTimeout: 10000,
    }
    return this.httpClient.makeRequest(requestOptions)
  }

  async getAccessToken(): Promise<AccessToken> {
    // Use the cached token if it is still valid, otherwise wait for a new token.
    if (this.isValidToken(this.accessToken)) {
      return this.accessToken
    }

    // stop poller first in order to make sure that it's not sleeping if we need a token immediately
    // Otherwise it could be hours before the expiration time passes normally
    this.stopPoller()

    // startPoller needs to be called somewhere, either lazily when a token is first requested, or at instantiation.
    // Doing it lazily currently
    this.pollerLoop().catch(() => {})

    return new Promise((resolve, reject) => {
      this.tokenEmitter.once('access_token', (event) => {
        if ('token' in event) {
          resolve(event.token)
        } else {
          reject(event.error)
        }
      })
    })
  }

  clearToken() {
    this.accessToken = undefined
  }

  isValidToken(token?: AccessToken): token is AccessToken {
    // TODO: Check if it has already expired?
    // otherwise this check is pretty much useless
    return typeof token !== 'undefined' && token !== null
  }
}
