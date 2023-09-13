// import { SignOptions, sign } from 'jsonwebtoken'
// import { FetchHTTPClient, HTTPClient, HTTPClientRequest } from './http-client'
// import { backoff } from '@segment/analytics-core'

// function sleep(timeoutInMs: number): Promise<void> {
//   return new Promise((resolve) => setTimeout(resolve, timeoutInMs))
// }

// export interface OauthSettings {
//   clientId: string
//   clientKey: Buffer
//   keyId: string
//   scope?: string
//   authServer?: string
//   issuedAt?: number
//   httpClient?: HTTPClient
//   maxRetries?: number
// }

// export class OauthManager {
//   clientId: string
//   clientKey: Buffer
//   keyId: string
//   scope: string
//   authServer: string
//   issuedAt?: number
//   httpClient: HTTPClient
//   maxRetries: number
//   token: string | undefined
//   refreshPromise: Promise<void> | undefined
//   refreshTimer: ReturnType<typeof setTimeout> | undefined

//   constructor(settings: OauthSettings) {
//     this.clientId = settings.clientId
//     this.clientKey = settings.clientKey
//     this.keyId = settings.keyId
//     this.scope = settings.scope ?? 'tracking_api:write'
//     this.authServer = settings.authServer ?? 'https://oauth2.segment.build/token'
//     this.issuedAt = settings.issuedAt
//     this.httpClient = settings.httpClient ?? new FetchHTTPClient()
//     this.maxRetries = settings.maxRetries ?? 3
//   }

//   RefreshToken = () => {
//     clearTimeout(data.refreshTimer)
//     data.refreshTimer = undefined
//     if (!data.refreshPromise) {
//       data.refreshPromise = RefreshTokenAsync(data)
//     }
//   }

//   RequestToken = async () => {
//     const header = {
//       alg: 'RS256',
//       kid: this.keyId,
//       'Content-Type': 'application/x-www-form-urlencoded',
//     } as Record<string, string>
//     const jti = Math.floor(Math.random() * 9999).toString()

//     const body = {
//       iss: this.clientId,
//       sub: this.clientId,
//       aud: 'https://oauth2.segment.io',
//       iat: this.issuedAt ?? Math.round(new Date().getTime() / 1000),
//       exp: Math.round(new Date().getTime() / 1000 + 60),
//       jti: jti,
//     }

//     const options: SignOptions = {
//       algorithm: 'RS256',
//       keyid: this.keyId,
//     }

//     const signedJwt = sign(body, this.clientKey, options)
//     const scope = this.scope ?? 'tracking_api:write'

//     const requestBody =
//       'grant_type=client_credentials' +
//       '&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer' +
//       '&client_assertion=' +
//       signedJwt +
//       '&scope=' +
//       scope

//     const authServer = this.authServer

//     const requestOptions: HTTPClientRequest = {
//       method: 'POST',
//       url: authServer,
//       body: requestBody,
//       headers: header,
//       httpRequestTimeout: 10000,
//     }

//     const maxAttempts = this.maxRetries
//     let currentAttempt = 0
//     let lastError = ''
//     while (currentAttempt < maxAttempts) {
//       currentAttempt++
//       try {
//         const response = await this.httpClient.makeRequest(requestOptions)

//         if (response.status === 200) {
//           let access_token = ''
//           let expires_in = 0
//           const result = await (response.json() as Promise<{
//             access_token: string
//             expires_in: number
//           }>)
//           try {
//             access_token = result.access_token
//             expires_in = result.expires_in
//           } catch {
//             throw new Error('Malformed token response - ' + result)
//           }
//           this.refreshTimer = setTimeout(
//             RefreshToken,
//             (expires_in * 1000) / 2,
//             this
//           )
//           this.refreshTimer.unref()
//           this.token = access_token
//           this.refreshPromise = undefined
//           return
//         }

//         // We may be refreshing the token early and still have a valid token.
//         if ([400, 401, 415].includes(response.status)) {
//           // Unrecoverable errors
//           throw new Error(response.statusText)
//         } else if (response.status == 429) {
//           // Rate limit, wait until reset timestamp
//           const rateLimitResetTime = response.headers['X-RateLimit-Reset']
//           let rateLimitDiff = 60
//           if (rateLimitResetTime) {
//             rateLimitDiff =
//               parseInt(rateLimitResetTime) -
//               Math.round(new Date().getTime() / 1000) +
//               5
//           }
//           data.refreshTimer = setTimeout(RefreshToken, rateLimitDiff, data)
//           data.refreshTimer.unref()
//           data.refreshPromise = undefined
//           return
//         }

//         lastError = response.statusText

//         // Retry after attempt-based backoff.
//         await sleep(
//           backoff({
//             attempt: currentAttempt,
//             minTimeout: 25,
//             maxTimeout: 1000,
//           })
//         )
//       } catch (err) {
//         clearTimeout(data.refreshTimer)
//         data.refreshTimer = undefined
//         data.refreshPromise = undefined
//         throw err
//       }
//     }
//     // Out of retries
//     clearTimeout(data.refreshTimer)
//     data.refreshTimer = undefined
//     data.refreshPromise = undefined
//     throw new Error('Retry limit reached - ' + lastError)
//   }
// }
