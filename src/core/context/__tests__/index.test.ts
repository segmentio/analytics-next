/* eslint-disable @typescript-eslint/unbound-method */
import { Context } from '..'
import { SegmentEvent } from '../../events'

describe(Context, () => {
  describe('.system', () => {
    it('creates a system event', () => {
      const ctx = Context.system()
      expect(ctx.event.event).toEqual('system')
    })
  })

  it('can log events', () => {
    const ctx = new Context({ type: 'track' })
    ctx.log('info', 'Log message', { test: 'test' })
    ctx.log('error', 'Error message', { test: 'test' })

    const logLines = ctx.logs()
    expect(logLines.length).toBe(2)
    expect(logLines[0].level).toEqual('info')
    expect(logLines[0].message).toEqual('Log message')

    jest.spyOn(ctx.logger, 'flush')
    ctx.flush()

    expect(ctx.logger.flush).toHaveBeenCalled()
  })

  it('can record stats', () => {
    const ctx = new Context({ type: 'track' })
    ctx.stats.increment('i1', 10, ['test:test'])
    ctx.stats.gauge('g1', 100, ['test:test'])

    const metrics = ctx.stats.metrics
    expect(metrics.length).toBe(2)

    expect(metrics[0].metric).toEqual('i1')
    expect(metrics[0].value).toEqual(10)

    jest.spyOn(ctx.stats, 'flush')
    ctx.flush()

    expect(ctx.stats.flush).toHaveBeenCalled()
  })

  describe('ids', () => {
    it('contains an uniq id', () => {
      const page = new Context({ type: 'page' })
      const track = new Context({ type: 'track' })

      expect(page.id).not.toBeFalsy()
      expect(track.id).not.toBeFalsy()
      expect(page.id).not.toEqual(track.id)
    })

    it('allows for comparing identity', () => {
      const page = new Context({ type: 'page' })
      const track = new Context({ type: 'track' })

      expect(page.id).not.toEqual(track.id)
      expect(page.isSame(track)).toBe(false)

      expect(page.isSame(page)).toBe(true)
      expect(track.isSame(track)).toBe(true)
    })
  })

  describe('events', () => {
    const evt: SegmentEvent = {
      type: 'identify',
      traits: {
        banana: 'phone',
      },
    }

    const anothaOne: SegmentEvent = {
      type: 'identify',
      traits: {
        name: 'DJ Khaled',
      },
    }

    it('holds an event', () => {
      const ctx = new Context(evt)
      expect(ctx.event).toBe(evt)
    })

    it('allows for resetting the event', () => {
      const ctx = new Context(evt)
      ctx.event = anothaOne
      expect(ctx.event).toEqual(anothaOne)
    })

    it('allows for partially updating the event', () => {
      const ctx = new Context(evt)
      ctx.updateEvent('traits.lastName', 'Farah')
      ctx.updateEvent('traits.firstName', 'Netto')

      ctx.updateEvent('traits.address', {
        street: '301 Brazos St',
        state: 'TX',
      })

      expect(ctx.event.traits).toEqual({
        address: {
          state: 'TX',
          street: '301 Brazos St',
        },
        banana: 'phone',
        firstName: 'Netto',
        lastName: 'Farah',
      })
    })

    it('cannot update event when ctx is sealed', () => {
      const ctx = new Context(evt)
      ctx.seal()

      ctx.updateEvent('traits.lastName', 'Farah')
      expect(ctx.event).toEqual(evt)

      ctx.event = anothaOne
      expect(ctx.event).toEqual(evt)

      const logs = ctx.logs().map((l) => ({ message: l.message, level: l.level }))
      expect(logs).toMatchInlineSnapshot(`
        Array [
          Object {
            "level": "warn",
            "message": "Context is sealed",
          },
          Object {
            "level": "warn",
            "message": "Context is sealed",
          },
        ]
      `)
    })
  })

  it('serializes a context to JSON', () => {
    const evt: SegmentEvent = {
      type: 'track',
      properties: {
        serializable: true,
      },
    }

    const ctx = new Context(evt)
    ctx.stats.increment('c1')
    ctx.log('warn', 'warning!')

    const str = JSON.stringify(ctx)

    expect(JSON.parse(str)).toEqual({
      event: {
        properties: {
          serializable: true,
        },
        type: 'track',
      },
      id: expect.any(String),
      logs: [
        {
          level: 'warn',
          message: 'warning!',
          time: expect.any(String),
        },
      ],
      metrics: [
        {
          metric: 'c1',
          tags: [],
          timestamp: expect.any(Number),
          type: 'counter',
          value: 1,
        },
      ],
    })
  })
})
