import { queryString } from '..'
import { Analytics } from '../../analytics'

let analytics: Analytics

describe('queryString', () => {
  beforeEach(() => {
    analytics = new Analytics({
      writeKey: 'abc',
    })
  })

  describe('calls', () => {
    describe('identify', () => {
      it('if `ajs_uid` is present', async () => {
        const spy = jest.spyOn(analytics, 'identify')
        await queryString(analytics, '?ajs_uid=1234')
        expect(spy).toHaveBeenCalledWith('1234', {})
        spy.mockRestore()
      })

      it('accepts encoded emails as `ajs_uid` params', async () => {
        const spy = jest.spyOn(analytics, 'identify')
        await queryString(analytics, '?ajs_uid=user%40example.org')
        expect(spy).toHaveBeenCalledWith('user@example.org', {})
        spy.mockRestore()
      })

      it('applies traits if `ajs_trait_` is present', async () => {
        const spy = jest.spyOn(analytics, 'identify')
        await queryString(analytics, '?ajs_uid=1234&ajs_trait_address=123 St')
        expect(spy).toHaveBeenCalledWith('1234', { address: '123 St' })
        spy.mockRestore()
      })

      it('applies multiple traits if `ajs_trait_` is declared more than once', async () => {
        const spy = jest.spyOn(analytics, 'identify')
        await queryString(
          analytics,
          '?ajs_uid=1234&ajs_trait_address=123 St&ajs_trait_city=Vancouver'
        )
        expect(spy).toHaveBeenCalledWith('1234', {
          address: '123 St',
          city: 'Vancouver',
        })
        spy.mockRestore()
      })

      it('only considers one `ajs_uid` received as parameter', async () => {
        const spy = jest.spyOn(analytics, 'identify')
        await queryString(
          analytics,
          '?ajs_uid=1234&ajs_trait_address=123 St&ajs_trait_address=908 St'
        )
        expect(spy).toHaveBeenCalledWith('1234', { address: '908 St' })
        spy.mockRestore()
      })
    })

    describe('track', () => {
      it('calls track if `ajs_event` is present', async () => {
        const spy = jest.spyOn(analytics, 'track')
        await queryString(analytics, '?ajs_event=Button Clicked')
        expect(spy).toHaveBeenCalledWith('Button Clicked', {})
        spy.mockRestore()
      })

      it('applies props if `ajs_prop_` is present', async () => {
        const spy = jest.spyOn(analytics, 'track')
        await queryString(
          analytics,
          '?ajs_event=Button Clicked&ajs_prop_location=Home Page'
        )
        expect(spy).toHaveBeenCalledWith('Button Clicked', {
          location: 'Home Page',
        })
        spy.mockRestore()
      })

      it('applies multiple props if `ajs_prop_` is declared more than once', async () => {
        const spy = jest.spyOn(analytics, 'track')
        await queryString(
          analytics,
          '?ajs_event=Button Clicked&ajs_prop_location=Home Page&ajs_prop_team=Instrumentation'
        )
        expect(spy).toHaveBeenCalledWith('Button Clicked', {
          location: 'Home Page',
          team: 'Instrumentation',
        })
        spy.mockRestore()
      })

      it('only considers the first `ajs_event` received as parameter', async () => {
        const spy = jest.spyOn(analytics, 'track')
        await queryString(
          analytics,
          '?ajs_event=Button Clicked&ajs_prop_location=Home Page&ajs_prop_location=Teams Page'
        )
        expect(spy).toHaveBeenCalledWith('Button Clicked', {
          location: 'Teams Page',
        })
        spy.mockRestore()
      })
    })

    describe('setAnonymousId', () => {
      it('if `ajs_aid` is present', async () => {
        const spy = jest.spyOn(analytics, 'setAnonymousId')
        await queryString(analytics, '?ajs_aid=immaghost')
        expect(spy).toHaveBeenCalledWith('immaghost')
        spy.mockRestore()
      })

      it('only considers the first aid received as parameter', async () => {
        const spy = jest.spyOn(analytics, 'setAnonymousId')
        await queryString(analytics, '?ajs_aid=imbatman&ajs_aid=bruce')
        expect(spy).toHaveBeenCalledWith('bruce')
        spy.mockRestore()
      })
    })

    describe('setting anonymous id when making track and identify calls', () => {
      it('updates the anonymous ids before track calls are made', async () => {
        const dispatchSpy = jest.spyOn(analytics as any, 'dispatch')
        await queryString(analytics, '?ajs_event=event&ajs_aid=ariel')
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            anonymousId: 'ariel',
            event: 'event',
          }),
          undefined
        )
        dispatchSpy.mockRestore()
      })
      it('updates the anonymous ids before identify calls are made', async () => {
        const dispatchSpy = jest.spyOn(analytics as any, 'dispatch')
        await queryString(analytics, '?ajs_uid=1234&ajs_aid=ariel')
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            anonymousId: 'ariel',
            userId: '1234',
          }),
          undefined
        )
        dispatchSpy.mockRestore()
      })
    })
  })
})
