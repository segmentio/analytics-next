import { MiddlewareFunction, sourceMiddlewarePlugin } from '..'
import { Analytics } from '../../../analytics'
import { Context } from '../../../core/context'
import { Plugin } from '../../../core/plugin'

describe(sourceMiddlewarePlugin, () => {
  const simpleMiddleware: MiddlewareFunction = ({ payload, next }) => {
    if (!payload.obj.context) {
      payload.obj.context = {}
    }

    payload.obj.context.hello = 'from the other side'

    next(payload)
  }

  const xt = sourceMiddlewarePlugin(simpleMiddleware)

  it('creates a source middleware', () => {
    expect(xt.name).toEqual('Source Middleware simpleMiddleware')
    expect(xt.version).toEqual('0.1.0')
  })

  it('is loaded automatically', async () => {
    // @ts-expect-error
    expect(await xt.load(Context.system())).toBeTruthy()
    expect(xt.isLoaded()).toBe(true)
  })

  describe('Middleware', () => {
    it('allows for changing the event', async () => {
      const changeProperties: MiddlewareFunction = ({ payload, next }) => {
        if (!payload.obj.properties) {
          payload.obj.properties = {}
        }
        payload.obj.properties.hello = 'from the other side'
        next(payload)
      }

      const xt = sourceMiddlewarePlugin(changeProperties)

      expect(
        (
          await xt.track!(
            new Context({
              type: 'track',
            })
          )
        ).event.properties
      ).toEqual({
        hello: 'from the other side',
      })
    })

    it('uses a segment facade object', async () => {
      let type = ''
      const facadeMiddleware: MiddlewareFunction = ({ payload, next }) => {
        type = payload.type()
        next(payload)
      }

      const xt = sourceMiddlewarePlugin(facadeMiddleware)

      await xt.track!(
        new Context({
          type: 'track',
        })
      )

      expect(type).toEqual(type)
    })

    it('does not continue unless `next` is called', async (done) => {
      const callback = jest.fn()

      const hangs: MiddlewareFunction = () => {}
      const hangsXT = sourceMiddlewarePlugin(hangs)

      const doesNotHang: MiddlewareFunction = ({ next, payload }) => {
        next(payload)
      }

      const doesNotHangXT = sourceMiddlewarePlugin(doesNotHang)

      Promise.resolve(hangsXT.track!(new Context({ type: 'track' })))
        .then(callback)
        .catch(callback)

      await doesNotHangXT.track!(new Context({ type: 'track' }))

      setTimeout(() => {
        expect(callback).not.toHaveBeenCalled()
        done()
      }, 500)
    })
  })

  describe('Common use cases', () => {
    it('can be used to re-route/cancel destinations', async () => {
      let middlewareInvoked = false
      const pageMock = jest.fn()

      const skipGA: MiddlewareFunction = ({ payload, next }) => {
        if (!payload.obj.integrations) {
          payload.obj.integrations = {}
        }

        payload.obj.integrations['Google Analytics'] = false
        middlewareInvoked = true
        next(payload)
      }

      const gaDestination: Plugin = {
        name: 'Google Analytics',
        isLoaded: () => true,
        load: async () => {},
        type: 'destination',
        version: '1.0',
        page: async (ctx) => {
          pageMock()
          return ctx
        },
      }

      const ajs = new Analytics({
        writeKey: 'abc',
      })
      await ajs.register(gaDestination)

      await ajs.page('hello')
      expect(pageMock).toHaveBeenCalled()

      await ajs.addSourceMiddleware(skipGA)
      await ajs.page('hello')
      expect(middlewareInvoked).toBe(true)
      expect(pageMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('Event API', () => {
    it('wraps track', async () => {
      const evt = new Context({
        type: 'track',
      })

      expect((await xt.track!(evt)).event.context).toMatchInlineSnapshot(`
        Object {
          "hello": "from the other side",
        }
      `)
    })

    it('wraps identify', async () => {
      const evt = new Context({
        type: 'identify',
      })

      expect((await xt.identify!(evt)).event.context).toMatchInlineSnapshot(`
        Object {
          "hello": "from the other side",
        }
      `)
    })

    it('wraps page', async () => {
      const evt = new Context({
        type: 'page',
      })

      expect((await xt.page!(evt)).event.context).toMatchInlineSnapshot(`
        Object {
          "hello": "from the other side",
        }
      `)
    })

    it('wraps group', async () => {
      const evt = new Context({
        type: 'group',
      })

      expect((await xt.group!(evt)).event.context).toMatchInlineSnapshot(`
        Object {
          "hello": "from the other side",
        }
      `)
    })

    it('wraps alias', async () => {
      const evt = new Context({
        type: 'alias',
      })

      expect((await xt.alias!(evt)).event.context).toMatchInlineSnapshot(`
        Object {
          "hello": "from the other side",
        }
      `)
    })
  })
})
