import { RefreshToken, OauthData, OauthSettings } from '../oauth-util'
import { TestFetchClient } from '../../__tests__/test-helpers/create-test-analytics'
import { readFileSync } from 'fs'

const privateKey = Buffer.from(`-----BEGIN PRIVATE KEY-----
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
-----END PRIVATE KEY-----`)

const testClient = new TestFetchClient()
const fetcher = jest.spyOn(testClient, 'makeRequest')

const createOAuthSuccess = (body?: any) => {
  return Promise.resolve({
    json: () => Promise.resolve(body),
    ok: true,
    status: 200,
    statusText: 'OK',
  }) as unknown as Promise<Response>
}

const createOAuthError = (overrides: Partial<Response> = {}) => {
  return Promise.resolve({
    ok: false,
    status: 400,
    statusText: 'Foo',
    ...overrides,
  }) as Promise<Response>
}

const getOauthData = () => {
  const oauthSettings = {
    clientId: 'clientId',
    clientKey: privateKey,
    keyId: 'keyId',
    scope: 'scope',
    authServer: 'http://127.0.0.1:1234',
  } as OauthSettings

  const oauthData = {
    httpClient: testClient,
    settings: oauthSettings,
    maxRetries: 3,
  } as unknown as OauthData
  return oauthData
}

test('OAuth Success', async () => {
  fetcher.mockReturnValueOnce(
    createOAuthSuccess({
      access_token: 'token',
      expires_in: 100,
    })
  )

  const oauthData = getOauthData()

  RefreshToken(oauthData)
  await oauthData.refreshPromise

  expect(oauthData.refreshTimer).toBeDefined()
  expect(oauthData.refreshPromise).toBeUndefined()
  expect(oauthData.token).toBe('token')
  expect(fetcher).toHaveBeenCalledTimes(1)
})

test('OAuth retry failure', async () => {
  fetcher.mockReturnValue(createOAuthError({ status: 425 }))

  const oauthData = getOauthData()

  RefreshToken(oauthData)
  await expect(oauthData.refreshPromise).rejects.toThrowError(
    'Retry limit reached - Foo'
  )

  expect(oauthData.refreshTimer).toBeUndefined()
  expect(oauthData.refreshPromise).toBeUndefined()
  expect(oauthData.token).toBeUndefined()
  expect(fetcher).toHaveBeenCalledTimes(3)
})

test('OAuth immediate failure', async () => {
  fetcher.mockReturnValue(createOAuthError({ status: 400 }))

  const oauthData = getOauthData()

  RefreshToken(oauthData)
  await expect(oauthData.refreshPromise).rejects.toThrowError('Foo')

  expect(oauthData.refreshTimer).toBeUndefined()
  expect(oauthData.refreshPromise).toBeUndefined()
  expect(oauthData.token).toBeUndefined()
  expect(fetcher).toHaveBeenCalledTimes(1)
})
