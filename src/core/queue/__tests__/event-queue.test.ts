import { Analytics } from '../../analytics'
import { pWhile } from '../../../lib/p-while'
import { Context } from '../../context'
import { Plugin } from '../../plugin'
import { EventQueue } from '../event-queue'
import { ActionDestination } from '../../../plugins/remote-loader'

async function flushAll(eq: EventQueue): Promise<Context[]> {
  const flushSpy = jest.spyOn(eq, 'flush')
  await pWhile(
    () => eq.queue.length > 0,
    async () => {
      return new Promise((r) => setTimeout(r, 0))
    }
  )
  const results = flushSpy.mock.results.map((r) => r.value)
  flushSpy.mockClear()

  const flushed = await Promise.all(results)
  return flushed.reduce((prev, cur) => {
    return prev.concat(cur)
  }, [])
}

const testPlugin: Plugin = {
  name: 'test',
  type: 'before',
  version: '0.1.0',
  load: () => Promise.resolve(),
  isLoaded: () => true,
}

const ajs = {} as Analytics

/**
 * This test file only contains event-queue tests that _are_ specific to this package.
 * You should prefer to write tests in packages/core
 */
const segmentio = {
  ...testPlugin,
  name: 'Segment.io',
  type: 'after' as const,
  track: (ctx: Context): Promise<Context> | Context => {
    return Promise.resolve(ctx)
  },
}

describe('alternative names', () => {
  test('delivers to action destinations using alternative names', async () => {
    const eq = new EventQueue()
    const fullstory = new ActionDestination('fullstory', testPlugin) // TODO: This should be re-written as higher level integration test.
    fullstory.alternativeNames.push('fullstory trackEvent')
    fullstory.type = 'destination'

    jest.spyOn(fullstory, 'track')
    jest.spyOn(segmentio, 'track')

    const evt = {
      type: 'track' as const,
      integrations: {
        All: false,
        'fullstory trackEvent': true,
        'Segment.io': {},
      },
    }

    const ctx = new Context(evt)

    await eq.register(Context.system(), fullstory, ajs)
    await eq.register(Context.system(), segmentio, ajs)

    void eq.dispatch(ctx)

    expect(eq.queue.length).toBe(1)
    const flushed = await flushAll(eq)

    expect(flushed).toEqual([ctx])

    expect(fullstory.track).toHaveBeenCalled()
    expect(segmentio.track).toHaveBeenCalled()
  })
})
