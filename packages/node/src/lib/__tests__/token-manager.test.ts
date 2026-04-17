import { sleep } from '@segment/analytics-core'
import { TestFetchClient } from '../../__tests__/test-helpers/create-test-analytics'
import { HTTPResponse } from '../http-client'
import { TokenManager, TokenManagerSettings } from '../token-manager'

// NOTE: Fake private key for illustrative purposes only
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDVll7uJaH322IN
PQsH2aOXZJ2r1q+6hpVK1R5JV1p41PUzn8pOxyXFHWB+53dUd4B8qywKS36XQjp0
VmhR1tQ22znQ9ZCM6y4LGeOJBjAZiFZLcGQNNrDFC0WGWTrK1ZTS2K7p5qy4fIXG
laNkMXiGGCawkgcHAdOvPTy8m1d9a6YSetYVmBP/tEYN95jPyZFIoHQfkQPBPr9W
cWPpdEBzasHV5d957akjurPpleDiD5as66UW4dkWXvS7Wu7teCLCyDApcyJKTb2Z
SXybmWjhIZuctZMAx3wT/GgW3FbkGaW5KLQgBUMzjpL0fCtMatlqckMD92ll1FuK
R+HnXu05AgMBAAECggEBAK4o2il4GDUh9zbyQo9ZIPLuwT6AZXRED3Igi3ykNQp4
I6S/s9g+vQaY6LkyBnSiqOt/K/8NBiFSiJWaa5/n+8zrP56qzf6KOlYk+wsdN5Vq
PWtwLrUzljpl8YAWPEFunNa8hwwE42vfZbnDBKNLT4qQIOQzfnVxQOoQlfj49gM2
iSrblvsnQTyucFy3UyTeioHbh8q2Xqcxry5WUCOrFDd3IIwATTpLZGw0IPeuFJbJ
NfBizLEcyJaM9hujQU8PRCRd16MWX+bbYM6Mh4dkT40QXWsVnHBHwsgPdQgDgseF
Na4ajtHoC0DlwYCXpCm3IzJfKfq/LR2q8NDUgKeF4AECgYEA9nD4czza3SRbzhpZ
bBoK77CSNqCcMAqyuHB0hp/XX3yB7flF9PIPb2ReO8wwmjbxn+bm7PPz2Uwd2SzO
pU+FXmyKJr53Jxw/hmDWZCoh42gsGDlVqpmytzsj74KlaYiMyZmEGbD7t/FGfNGV
LdLDJaHIYxEimFviOTXKCeKvPAECgYEA3d8tv4jdp1uAuRZiU9Z/tfw5mJOi3oXF
8AdFFDwaPzcTorEAxjrt9X6IjPbLIDJNJtuXYpe+dG6720KyuNnhLhWW9oZEJTwT
dUgqZ2fTCOS9uH0jSn+ZFlgTWI6UDQXRwE7z8avlhMIrQVmPsttGTo7V6sQVtGRx
bNj2RSVekTkCgYAJvy4UYLPHS0jWPfSLcfw8vp8JyhBjVgj7gncZW/kIrcP1xYYe
yfQSU8XmV40UjFfCGz/G318lmP0VOdByeVKtCV3talsMEPHyPqI8E+6DL/uOebYJ
qUqINK6XKnOgWOY4kvnGillqTQCcry1XQp61PlDOmj7kB75KxPXYrj6AAQKBgQDa
+ixCv6hURuEyy77cE/YT/Q4zYnL6wHjtP5+UKwWUop1EkwG6o+q7wtiul90+t6ah
1VUCP9X/QFM0Qg32l0PBohlO0pFrVnG17TW8vSHxwyDkds1f97N19BOT8ZR5jebI
sKPfP9LVRnY+l1BWLEilvB+xBzqMwh2YWkIlWI6PMQKBgGi6TBnxp81lOYrxVRDj
/3ycRnVDmBdlQKFunvfzUBmG1mG/G0YHeVSUKZJGX7w2l+jnDwIA383FcUeA8X6A
l9q+amhtkwD/6fbkAu/xoWNl+11IFoxd88y2ByBFoEKB6UVLuCTSKwXDqzEZet7x
mDyRxq7ohIzLkw8b8buDeuXZ
-----END PRIVATE KEY-----`

const testClient = new TestFetchClient()
const fetcher = jest.spyOn(testClient, 'makeRequest')

const createOAuthSuccess = async (body?: any): Promise<HTTPResponse> => ({
  text: async () => JSON.stringify(body),
  status: 200,
  statusText: 'OK',
})

const createOAuthError = async (
  overrides: Partial<HTTPResponse> = {}
): Promise<HTTPResponse> => ({
  text: async () => '',
  status: 400,
  statusText: 'Foo',
  ...overrides,
})

const getTokenManager = () => {
  const oauthSettings: TokenManagerSettings = {
    httpClient: testClient,
    maxRetries: 3,
    clientId: 'clientId',
    clientKey: privateKey,
    keyId: 'keyId',
    scope: 'scope',
    authServer: 'http://127.0.0.1:1234',
  }

  return new TokenManager(oauthSettings)
}

test(
  'OAuth Success',
  async () => {
    fetcher.mockReturnValueOnce(
      createOAuthSuccess({ access_token: 'token', expires_in: 100 })
    )

    const tokenManager = getTokenManager()
    const token = await tokenManager.getAccessToken()
    tokenManager.stopPoller()

    expect(tokenManager.isValidToken(token)).toBeTruthy()
    expect(token.access_token).toBe('token')
    expect(token.expires_in).toBe(100)
    expect(fetcher).toHaveBeenCalledTimes(1)
  },
  30 * 1000
)

test('isValidToken returns false for undefined token', () => {
  const tokenManager = getTokenManager()

  expect(tokenManager.isValidToken(undefined)).toBeFalsy()
})

test('isValidToken returns false when expires_at is missing or in the past', () => {
  const tokenManager = getTokenManager()
  const nowInSeconds = Math.round(Date.now() / 1000)

  const tokenWithoutExpiresAt: any = {
    access_token: 'token',
    expires_in: 100,
  }

  const expiredToken: any = {
    access_token: 'token',
    expires_in: 100,
    expires_at: nowInSeconds - 10,
  }

  expect(tokenManager.isValidToken(tokenWithoutExpiresAt)).toBeFalsy()
  expect(tokenManager.isValidToken(expiredToken)).toBeFalsy()
})

test('isValidToken returns true when expires_at is in the future', () => {
  const tokenManager = getTokenManager()
  const nowInSeconds = Math.round(Date.now() / 1000)

  const validToken: any = {
    access_token: 'token',
    expires_in: 100,
    expires_at: nowInSeconds + 60,
  }

  expect(tokenManager.isValidToken(validToken)).toBeTruthy()
})

test('OAuth retry failure', async () => {
  fetcher.mockReturnValue(createOAuthError({ status: 425 }))

  const tokenManager = getTokenManager()

  await expect(tokenManager.getAccessToken()).rejects.toThrowError('Foo')
  tokenManager.stopPoller()

  expect(fetcher).toHaveBeenCalledTimes(3)
})

test('OAuth immediate failure', async () => {
  fetcher.mockReturnValue(createOAuthError({ status: 400 }))

  const tokenManager = getTokenManager()

  await expect(tokenManager.getAccessToken()).rejects.toThrowError('Foo')
  tokenManager.stopPoller()

  expect(fetcher).toHaveBeenCalledTimes(1)
})

test('OAuth rate limit spaces retries using Retry-After seconds', async () => {
  const callTimes: number[] = []

  fetcher
    .mockImplementationOnce(() => {
      callTimes.push(Date.now())
      return createOAuthError({
        status: 429,
        headers: { 'Retry-After': '1' },
      })
    })
    .mockImplementationOnce(() => {
      callTimes.push(Date.now())
      return createOAuthError({
        status: 429,
        headers: { 'Retry-After': '1' },
      })
    })
    .mockImplementationOnce(() => {
      callTimes.push(Date.now())
      return createOAuthSuccess({ access_token: 'token', expires_in: 100 })
    })

  const tokenManager = getTokenManager()

  const tokenPromise = tokenManager.getAccessToken()

  // First request should happen immediately
  await sleep(50)
  expect(fetcher).toHaveBeenCalledTimes(1)

  // Allow enough time for the two 1s-spaced retries to occur
  await sleep(2500)

  const token = await tokenPromise
  expect(tokenManager.isValidToken(token)).toBeTruthy()
  expect(token.access_token).toBe('token')
  expect(token.expires_in).toBe(100)
  expect(fetcher).toHaveBeenCalledTimes(3)

  // Validate that retries did not bunch up: at least ~1s apart
  expect(callTimes.length).toBe(3)
  const firstDelay = callTimes[1] - callTimes[0]
  const secondDelay = callTimes[2] - callTimes[1]
  expect(firstDelay).toBeGreaterThanOrEqual(900)
  expect(secondDelay).toBeGreaterThanOrEqual(900)
})

test('OAuth schedules background refresh at half lifetime', async () => {
  const tokenManager: any = getTokenManager()
  const queueSpy = jest.spyOn(tokenManager as any, 'queueNextPoll')

  fetcher.mockReturnValueOnce(
    createOAuthSuccess({ access_token: 'token-1', expires_in: 100 })
  )

  const token = await tokenManager.getAccessToken()
  expect(token.access_token).toBe('token-1')
  expect(fetcher).toHaveBeenCalledTimes(1)

  // Should schedule a refresh at half the lifetime (expires_in / 2 seconds)
  expect(queueSpy).toHaveBeenCalled()
  const delayMs = queueSpy.mock.calls[0][0]
  expect(delayMs).toBe(50 * 1000)

  tokenManager.stopPoller()
})
