import { HTTPResponse } from '../lib/http-client'
import { OAuthSettings } from '../lib/types'
import {
  TestFetchClient,
  createTestAnalytics,
} from './test-helpers/create-test-analytics'
import { createError } from './test-helpers/factories'
import { resolveCtx } from './test-helpers/resolve-ctx'

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

jest.setTimeout(10000)
const timestamp = new Date()

class OauthFetchClient extends TestFetchClient {}

const oauthTestClient = new OauthFetchClient()
const oauthFetcher = jest.spyOn(oauthTestClient, 'makeRequest')

const tapiTestClient = new TestFetchClient()
const tapiFetcher = jest.spyOn(tapiTestClient, 'makeRequest')

const getOauthSettings = () =>
  ({
    httpClient: oauthTestClient,
    maxRetries: 3,
    clientId: 'clientId',
    clientKey: privateKey,
    keyId: 'keyId',
    scope: 'scope',
    authServer: 'http://127.0.0.1:1234',
  } as OAuthSettings)

const createOAuthSuccess = async (body?: any): Promise<HTTPResponse> => ({
  text: () => Promise.resolve(JSON.stringify(body)),
  status: 200,
  statusText: 'OK',
})

const createOAuthError = async (
  overrides: Partial<HTTPResponse> = {}
): Promise<HTTPResponse> => ({
  status: 400,
  statusText: 'Foo',
  text: () => Promise.resolve(''),
  ...overrides,
})

describe('OAuth Integration Success', () => {
  it('track event with OAuth', async () => {
    const analytics = createTestAnalytics({
      oauthSettings: getOauthSettings(),
    })
    const eventName = 'Test Event'

    oauthFetcher.mockReturnValue(
      createOAuthSuccess({ access_token: 'token', expires_in: 100 })
    )

    analytics.track({
      event: eventName,
      anonymousId: 'unknown',
      userId: 'known',
      timestamp: timestamp,
    })

    const ctx1 = await resolveCtx(analytics, 'track')

    expect(ctx1.event.type).toEqual('track')
    expect(ctx1.event.event).toEqual(eventName)
    expect(ctx1.event.properties).toEqual({})
    expect(ctx1.event.anonymousId).toEqual('unknown')
    expect(ctx1.event.userId).toEqual('known')
    expect(ctx1.event.timestamp).toEqual(timestamp)

    expect(oauthFetcher).toHaveBeenCalledTimes(1)

    await analytics.closeAndFlush()
  })
  it('track event with OAuth after retry', async () => {
    const analytics = createTestAnalytics({
      oauthSettings: getOauthSettings(),
    })
    oauthFetcher
      .mockReturnValueOnce(createOAuthError({ status: 425 }))
      .mockReturnValueOnce(
        createOAuthSuccess({ access_token: 'token', expires_in: 100 })
      )

    const eventName = 'Test Event'

    analytics.track({
      event: eventName,
      anonymousId: 'unknown',
      userId: 'known',
      timestamp: timestamp,
    })

    const ctx1 = await resolveCtx(analytics, 'track')

    expect(ctx1.event.type).toEqual('track')
    expect(ctx1.event.event).toEqual(eventName)
    expect(ctx1.event.properties).toEqual({})
    expect(ctx1.event.anonymousId).toEqual('unknown')
    expect(ctx1.event.userId).toEqual('known')
    expect(ctx1.event.timestamp).toEqual(timestamp)

    expect(oauthFetcher).toHaveBeenCalledTimes(2)

    await analytics.closeAndFlush()
  })

  it('delays appropriately on 429 error', async () => {
    const analytics = createTestAnalytics({
      oauthSettings: getOauthSettings(),
    })
    const retryTime = Date.now() + 250
    oauthFetcher
      .mockReturnValueOnce(
        createOAuthError({
          status: 429,
          headers: { 'X-RateLimit-Reset': retryTime },
        })
      )
      .mockReturnValue(
        createOAuthSuccess({ access_token: 'token', expires_in: 100 })
      )

    analytics.track({
      event: 'Test Event',
      anonymousId: 'unknown',
      userId: 'known',
      timestamp: timestamp,
    })
    const ctx1 = await resolveCtx(analytics, 'track') // forces exception to be thrown
    expect(ctx1.event.type).toEqual('track')
    await analytics.closeAndFlush()
    expect(retryTime).toBeLessThan(Date.now())
  })
})

describe('OAuth Failure', () => {
  it('surfaces error after retries', async () => {
    const analytics = createTestAnalytics({
      oauthSettings: getOauthSettings(),
    })

    oauthFetcher.mockReturnValue(createOAuthError({ status: 500 }))

    const eventName = 'Test Event'

    try {
      analytics.track({
        event: eventName,
        anonymousId: 'unknown',
        userId: 'known',
        timestamp: timestamp,
      })

      const ctx1 = await resolveCtx(analytics, 'track')

      expect(ctx1.event.type).toEqual('track')
      expect(ctx1.event.event).toEqual(eventName)
      expect(ctx1.event.properties).toEqual({})
      expect(ctx1.event.anonymousId).toEqual('unknown')
      expect(ctx1.event.userId).toEqual('known')
      expect(ctx1.event.timestamp).toEqual(timestamp)

      expect(oauthFetcher).toHaveBeenCalledTimes(3)

      await analytics.closeAndFlush()

      throw new Error('fail')
    } catch (err: any) {
      expect(err.reason).toEqual(new Error('[500] Foo'))
      expect(err.code).toMatch(/delivery_failure/)
    }
  })

  it('surfaces error after failing immediately', async () => {
    const logger = jest.fn()
    const analytics = createTestAnalytics({
      oauthSettings: getOauthSettings(),
    }).on('error', (err) => {
      logger(err)
    })

    oauthFetcher.mockReturnValue(createOAuthError({ status: 400 }))

    try {
      analytics.track({
        event: 'Test Event',
        anonymousId: 'unknown',
        userId: 'known',
        timestamp: timestamp,
      })

      const ctx1 = await resolveCtx(analytics, 'track') // forces exception to be thrown
      expect(ctx1.event.type).toEqual('track')
      await analytics.closeAndFlush()

      expect(logger).toHaveBeenCalledWith('foo')
      throw new Error('fail')
    } catch (err: any) {
      expect(err.reason).toEqual(new Error('[400] Foo'))
      expect(err.code).toMatch(/delivery_failure/)
    }
  })

  it('handles a bad key', async () => {
    const props = getOauthSettings()
    props.clientKey = 'Garbage'
    const analytics = createTestAnalytics({
      oauthSettings: props,
    })

    try {
      analytics.track({
        event: 'Test Event',
        anonymousId: 'unknown',
        userId: 'known',
        timestamp: timestamp,
      })
      await analytics.closeAndFlush()
      const ctx1 = await resolveCtx(analytics, 'track') // forces exception to be thrown
      expect(ctx1.event.type).toEqual('track')
      throw new Error('fail')
    } catch (err: any) {
      expect(err.reason).toEqual(
        new Error(
          'secretOrPrivateKey must be an asymmetric key when using RS256'
        )
      )
    }
  })

  it('OAuth inherits Analytics custom client', async () => {
    const oauthSettings = getOauthSettings()
    oauthSettings.httpClient = undefined
    const analytics = createTestAnalytics({
      oauthSettings: oauthSettings,
      httpClient: tapiTestClient,
    })
    tapiFetcher.mockReturnValue(createOAuthError({ status: 415 }))

    try {
      analytics.track({
        event: 'Test Event',
        anonymousId: 'unknown',
        userId: 'known',
        timestamp: timestamp,
      })

      await resolveCtx(analytics, 'track')
      await analytics.closeAndFlush()

      throw new Error('fail')
    } catch (err: any) {
      expect(err.reason).toEqual(new Error('[415] Foo'))
      expect(err.code).toMatch(/delivery_failure/)
    }
  })
})

describe('TAPI rejection', () => {
  it('surfaces error', async () => {
    const analytics = createTestAnalytics({
      oauthSettings: getOauthSettings(),
      httpClient: tapiTestClient,
    })
    const eventName = 'Test Event'

    oauthFetcher.mockReturnValue(
      createOAuthSuccess({ access_token: 'token', expires_in: 100 })
    )
    tapiFetcher.mockReturnValue(
      createError({
        status: 400,
        statusText:
          '{"success":false,"message":"malformed JSON","code":"invalid_request"}',
      })
    )

    try {
      analytics.track({
        event: eventName,
        anonymousId: 'unknown',
        userId: 'known',
        timestamp: timestamp,
      })

      const ctx1 = await resolveCtx(analytics, 'track')

      expect(ctx1.event.type).toEqual('track')
      expect(ctx1.event.event).toEqual(eventName)
      expect(ctx1.event.properties).toEqual({})
      expect(ctx1.event.anonymousId).toEqual('unknown')
      expect(ctx1.event.userId).toEqual('known')
      expect(ctx1.event.timestamp).toEqual(timestamp)

      expect(oauthFetcher).toHaveBeenCalledTimes(1)

      await analytics.closeAndFlush()
      throw new Error('fail')
    } catch (err: any) {
      expect(err.code).toBe('delivery_failure')
    }
  })
})
