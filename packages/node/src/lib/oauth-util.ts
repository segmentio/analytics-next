import { SignOptions, sign } from 'jsonwebtoken'
import { HTTPClient, HTTPClientRequest } from './http-client'

export interface OauthSettings {
  clientId: string
  clientKey: Buffer
  keyId: string
  scope?: string
  authServer?: string
  jti?: string
  issuedAt?: number
}

export interface OauthData {
  httpClient: HTTPClient
  settings: OauthSettings
  token: string | undefined
  refreshPromise: Promise<string | undefined>
  refreshTimer: ReturnType<typeof setTimeout>
}

export const RefreshToken = (data: OauthData) => {
  clearTimeout(data.refreshTimer)
  data.refreshPromise = RefreshTokenAsync(data)
}

export const RefreshTokenAsync = async (data: OauthData) => {
  const header = {
    alg: 'RS256',
    kid: data.settings.keyId,
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  const jti = data.settings.jti ?? Math.floor(Math.random() * 9999).toString()

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

  try {
    const response = data.httpClient
      .makeRequest(requestOptions)
      .then((response) => {
        if (response.status != 200) {
          if (response.status == 429) {
            const rateLimitResetTime = response.headers.get('X-RateLimit-Reset')
            let rateLimitDiff = 60
            if (rateLimitResetTime) {
              rateLimitDiff =
                parseInt(rateLimitResetTime) -
                Math.round(new Date().getTime() / 1000) +
                5
            }
            data.refreshTimer = setTimeout(RefreshToken, rateLimitDiff, data)
            data.refreshTimer.unref()
          }
          throw new Error(response.statusText)
        }
        return response.json() as Promise<{
          access_token: string
          expires_in: number
        }>
      })
      .then((result) => {
        data.refreshTimer = setTimeout(
          RefreshToken,
          (result.expires_in * 1000) / 2,
          data
        )
        data.refreshTimer.unref()
        data.token = result.access_token
        return result.access_token
      })
    return response
  } catch (err) {
    console.error(err)
  }
}
