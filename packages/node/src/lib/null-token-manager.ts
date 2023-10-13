import type { AccessToken, OAuthSettings, TokenManager } from './types'

export class NullTokenManager implements TokenManager {
  constructor(_props: OAuthSettings) {}

  clearToken(): void {}
  getAccessToken(): Promise<AccessToken> {
    throw new Error(`OAuth is not currently supported in this runtime.`)
  }
  isValidToken(_token?: AccessToken | undefined): _token is AccessToken {
    return false
  }
  pollerLoop(): Promise<void> {
    return Promise.resolve()
  }
  stopPoller(): void {}
}
