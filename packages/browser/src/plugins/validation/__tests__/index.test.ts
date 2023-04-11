import { validation } from '..'
import { Context } from '../../../core/context'
import { SegmentEvent } from '../../../core/events'

const validEvent: SegmentEvent = {
  type: 'track',
  anonymousId: 'abc',
  event: 'test',
  properties: {},
  traits: {},
}

describe('validation', () => {
  ;['track', 'identify', 'group', 'page', 'alias'].forEach((method) => {
    // @ts-ignore
    const validationFn: Function = validation[method] as any
    describe(method, () => {
      it('validates that the `event` exists', async () => {
        try {
          // @ts-ignore
          await validationFn(new Context())
        } catch (err) {
          expect(err).toBeTruthy()
        }
        expect.assertions(1)
      })

      it('validates that `event.event` exists', async () => {
        if (method === 'track') {
          try {
            await validationFn(
              new Context({
                ...validEvent,
                event: undefined,
              })
            )
          } catch (err) {
            expect(err).toBeTruthy()
          }
          expect.assertions(1)
        }
      })

      it('validates that `properties` or `traits` are objects', async () => {
        if (method === 'alias') {
          return
        }
        try {
          await validationFn(
            new Context({
              ...validEvent,
              properties: undefined,
              traits: undefined,
            })
          )
        } catch (err) {
          expect(err).toBeTruthy()
        }
        expect.assertions(1)
      })

      it('validates that it contains an user', async () => {
        try {
          await validationFn(
            new Context({
              ...validEvent,
              userId: undefined,
              anonymousId: undefined,
            })
          )
        } catch (err) {
          expect(err).toBeTruthy()
        }
        expect.assertions(1)
      })
    })
  })
})
