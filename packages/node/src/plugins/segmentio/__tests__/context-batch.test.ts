import { ContextBatch } from '../context-batch'
import { NodeEventFactory } from '../../../app/event-factory'
import { Context } from '../../../app/context'

const eventFactory = new NodeEventFactory()
const pending = (context: Context) => ({ resolver: () => undefined, context })

describe('ContextBatch', () => {
  it('rejects an event that exceeds the 32 KB per-event size limit', () => {
    // ~40 KB of JSON, well over the 32 KB per-event cap
    const event = eventFactory.track(
      'big',
      { data: 'a'.repeat(40000) },
      { userId: 'u' }
    )
    const batch = new ContextBatch(100)
    const result = batch.tryAdd(pending(new Context(event)))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.message).toContain('exceeds maximum event size')
    }
  })

  it('accepts a normal small event', () => {
    const event = eventFactory.track('small', { ok: true }, { userId: 'u' })
    const batch = new ContextBatch(100)
    expect(batch.tryAdd(pending(new Context(event))).success).toBe(true)
  })
})
