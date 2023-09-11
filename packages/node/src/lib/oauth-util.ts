import { SignOptions, sign } from 'jsonwebtoken'
import { HTTPClient, HTTPClientRequest } from './http-client'
import { backoff } from '@segment/analytics-core'

function sleep(timeoutInMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeoutInMs))
}

export interface OauthSettings {
  clientId: string
  clientKey: Buffer
  keyId: string
  scope?: string
  authServer?: string
  issuedAt?: number
}

export interface OauthData {
  httpClient: HTTPClient
  settings: OauthSettings
  token: string | undefined
  refreshPromise: Promise<void> | undefined
  refreshTimer: ReturnType<typeof setTimeout> | undefined
  maxRetries: number
}

export const RefreshToken = (data: OauthData) => {
  clearTimeout(data.refreshTimer)
  data.refreshTimer = undefined
  if (!data.refreshPromise) {
    data.refreshPromise = RefreshTokenAsync(data)
  }
}

export const RefreshTokenAsync = async (data: OauthData) => {
  const header = {
    alg: 'RS256',
    kid: data.settings.keyId,
    'Content-Type': 'application/x-www-form-urlencoded',
  } as Record<string, string>
  const jti = Math.floor(Math.random() * 9999).toString()

  const body = {
    iss: data.settings.clientId,
    sub: data.settings.clientId,
    aud: 'https://oauth2.segment.io',
    iat: data.settings.issuedAt ?? Math.round(new Date().getTime() / 1000),
    exp: Math.round(new Date().getTime() / 1000 + 60),
    jti: jti,
  }

  const options: SignOptions = {
    algorithm: 'RS256',
    keyid: data.settings.keyId,
  }

  const signedJwt = sign(body, data.settings.clientKey, options)
  const scope = data.settings.scope ?? 'tracking_api:write'

  const requestBody =
    'grant_type=client_credentials' +
    '&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer' +
    '&client_assertion=' +
    signedJwt +
    '&scope=' +
    scope

  const authServer =
    data.settings.authServer ?? 'https://oauth2.segment.build/token'

  const requestOptions: HTTPClientRequest = {
    method: 'POST',
    url: authServer,
    body: requestBody,
    headers: header,
    httpRequestTimeout: 10000,
  }

  const maxAttempts = data.maxRetries
  let currentAttempt = 0
  let lastError = ''
  while (currentAttempt < maxAttempts) {
    currentAttempt++
    try {
      const response = await data.httpClient.makeRequest(requestOptions)

      if (response.status === 200) {
        let access_token = ''
        let expires_in = 0
        const result = await (response.json() as Promise<{
          access_token: string
          expires_in: number
        }>)
        try {
          access_token = result.access_token
          expires_in = result.expires_in
        } catch {
          throw new Error('Malformed token response - ' + result)
        }
        data.refreshTimer = setTimeout(
          RefreshToken,
          (expires_in * 1000) / 2,
          data
        )
        data.refreshTimer.unref()
        data.token = access_token
        data.refreshPromise = undefined
        return
      }

      // We may be refreshing the token early and still have a valid token.
      if ([400, 401, 415].includes(response.status)) {
        // Unrecoverable errors
        throw new Error(response.statusText)
      } else if (response.status == 429) {
        // Rate limit, wait until reset timestamp
        const rateLimitResetTime = response.headers['X-RateLimit-Reset']
        let rateLimitDiff = 60
        if (rateLimitResetTime) {
          rateLimitDiff =
            parseInt(rateLimitResetTime) -
            Math.round(new Date().getTime() / 1000) +
            5
        }
        data.refreshTimer = setTimeout(RefreshToken, rateLimitDiff, data)
        data.refreshTimer.unref()
        data.refreshPromise = undefined
        return
      }

      lastError = response.statusText

      // Retry after attempt-based backoff.
      await sleep(
        backoff({
          attempt: currentAttempt,
          minTimeout: 25,
          maxTimeout: 1000,
        })
      )
    } catch (err) {
      clearTimeout(data.refreshTimer)
      data.refreshTimer = undefined
      data.refreshPromise = undefined
      throw err
    }
  }
  // Out of retries
  clearTimeout(data.refreshTimer)
  data.refreshTimer = undefined
  data.refreshPromise = undefined
  throw new Error('Retry limit reached - ' + lastError)
}
