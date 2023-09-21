import { uuid } from './uuid'
import {
  FetchHTTPClient,
  HTTPClient,
  HTTPClientRequest,
  HTTPResponse,
} from './http-client'
import { SignOptions, sign } from 'jsonwebtoken'
import { Emitter, backoff, sleep } from '@segment/analytics-core'
import { AbortSignal, AbortController } from './abort'

type AccessToken = {
  access_token: string
  expires_in: number
}

export type TokenManagerProps = {
  httpClient: HTTPClient | undefined
  maxRetries: number
  authServer: string
  scope: string
  clientId: string
  clientKey: Buffer
  keyId: string
}

export class TokenManager {
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

  private controller: AbortController
  private signal: AbortSignal

  private accessToken?: AccessToken
  private isRunning = false
  private tokenEmitter = new Emitter<{
    access_token: [{ token: AccessToken } | { error: unknown }]
  }>()

  constructor(props: TokenManagerProps) {
    this.keyId = props.keyId
    this.clientId = props.clientId
    this.clientKey = props.clientKey
    this.authServer = props.authServer
    this.scope = props.scope
    this.httpClient = props.httpClient ?? new FetchHTTPClient()
    this.maxRetries = props.maxRetries
    this.tokenEmitter.on('access_token', (event) => {
      if ('token' in event) {
        this.accessToken = event.token
      }
    })
    this.controller = new AbortController()
    this.signal = this.controller.signal
  }

  async startPoller() {
    if (this.isRunning) return
    this.isRunning = true

    let retryCount = 0
    let lastError: any

    while (this.isRunning) {
      let timeUntilRefreshInMs = 25
      let response: HTTPResponse

      try {
        response = await this.requestAccessToken()
      } catch (err) {
        // Error without a status code - likely networking, retry
        retryCount++
        lastError = err

        if (retryCount % this.maxRetries == 0) {
          this.tokenEmitter.emit('access_token', { error: lastError })
        }

        await sleep(
          backoff({
            attempt: retryCount,
            minTimeout: 25,
            maxTimeout: 1000,
          }),
          this.signal
        )
        continue
      }

      if (
        response.headers !== undefined &&
        response.headers.Date != undefined
      ) {
        const serverTime = Date.parse(response.headers.Date)
        const skew = Date.now() - serverTime
        if (this.clockSkewInSeconds == 0) {
          this.clockSkewInSeconds = skew
        } else {
          this.clockSkewInSeconds = (this.clockSkewInSeconds + skew) / 2
        }
      }

      // Handle status codes!
      if (response.status === 200) {
        let body: any
        try {
          body = await response.json() //body?.getReader().read() // TODO: Replace with actual method to get body - needs discussion since different HTTP clients expose this differently (buffers, streams, strings, objects)
        } catch (err) {
          // Errors reading the body (not parsing) are likely networking issues, we can retry
          retryCount++
          lastError = err
          timeUntilRefreshInMs = backoff({
            attempt: retryCount,
            minTimeout: 25,
            maxTimeout: 1000,
          })
          continue
        }
        let token: AccessToken
        try {
          const parsedBody = /*JSON.parse(*/ body //)
          // TODO: validate JSON
          token = parsedBody
          this.tokenEmitter.emit('access_token', { token })

          // Reset our failure count
          retryCount = 0

          // Refresh the token after half the expiry time passes
          if (token !== undefined && token.expires_in !== undefined) {
            timeUntilRefreshInMs = Math.floor((token.expires_in / 2) * 1000)
          } else {
            timeUntilRefreshInMs = 60 * 1000
          }
        } catch (err) {
          // Something went really wrong with the body, lets surface an error and try again?
          this.tokenEmitter.emit('access_token', { error: err })
          retryCount = 0

          timeUntilRefreshInMs = backoff({
            attempt: retryCount,
            minTimeout: 25,
            maxTimeout: 1000,
          })
        }
      } else if (response.status === 429) {
        retryCount++
        lastError = `[${response.status}] ${response.statusText}`
        const rateLimitResetTime = parseInt(
          response.headers['X-RateLimit-Reset'],
          10
        )
        if (isFinite(rateLimitResetTime)) {
          timeUntilRefreshInMs =
            rateLimitResetTime - Date.now() + this.clockSkewInSeconds * 1000
        } else {
          timeUntilRefreshInMs = 5 * 1000
        }
      } else if ([400, 401, 415].includes(response.status)) {
        // Unrecoverable errors
        retryCount = 0
        this.tokenEmitter.emit('access_token', {
          error: new Error(`[${response.status}] ${response.statusText}`),
        })
        this.stopPoller()
        return
      } else {
        retryCount++
        lastError = new Error(`[${response.status}] ${response.statusText}`)
        timeUntilRefreshInMs = backoff({
          attempt: retryCount,
          minTimeout: 25,
          maxTimeout: 1000,
        })
      }

      if (retryCount % this.maxRetries == 0) {
        this.tokenEmitter.emit('access_token', { error: lastError })
        // TODO: figure out timing and whether to reset retries?
      }
      await sleep(timeUntilRefreshInMs, this.signal)
    }
  }

  stopPoller() {
    if (this.isRunning) {
      this.controller.abort()
    }
    this.isRunning = false
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
      aud: 'https://oauth2.segment.io',
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
    // Doing it lazily for this example
    this.startPoller().catch(() => {})

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
