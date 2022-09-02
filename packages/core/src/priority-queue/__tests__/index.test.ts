import { PriorityQueue } from '..'
import { calculateMaxTotalRetryTime } from '../backoff'

type Item = {
  id: string
}

describe('RetryQueue', () => {
  it('accepts new work', () => {
    const queue = new PriorityQueue<Item>(10, [])
    queue.push({ id: 'abc' }, { id: 'cde' })
    expect(queue.length).toBe(2)
  })

  it('pops items off the queue', () => {
    const queue = new PriorityQueue<Item>(10, [])
    queue.push({ id: 'abc' }, { id: 'cde' })

    expect(queue.pop()).toEqual({ id: 'abc' })
    expect(queue.length).toBe(1)

    expect(queue.pop()).toEqual({ id: 'cde' })
    expect(queue.length).toBe(0)
  })

  it('deprioritizes repeated items', () => {
    const queue = new PriorityQueue<Item>(10, [])
    queue.push({ id: 'abc' })
    queue.push({ id: 'abc' })

    queue.push({ id: 'cde' })

    // deprioritizes 'abc' because it was seen twice
    expect(queue.pop()).toEqual({ id: 'cde' })
  })

  it('deprioritizes repeated items even though they have been popped before', () => {
    const queue = new PriorityQueue<Item>(10, [])
    queue.push({ id: 'abc' })
    queue.pop()

    queue.push({ id: 'abc' })
    queue.push({ id: 'cde' })

    // a queue does not forget
    expect(queue.pop()).toEqual({ id: 'cde' })
  })

  it('stops accepting an item after attempts have been exausted', () => {
    const queue = new PriorityQueue<Item>(3, [])
    queue.push({ id: 'abc' })
    expect(queue.length).toBe(1)
    queue.pop()

    queue.push({ id: 'abc' })
    expect(queue.length).toBe(1)
    queue.pop()

    queue.push({ id: 'abc' })
    expect(queue.length).toBe(1)
    queue.pop()

    queue.push({ id: 'abc' })
    // does not accept it anymore
    expect(queue.length).toBe(0)
  })
})

describe('backoffs', () => {
  afterEach(() => {
    jest.clearAllTimers()
  })

  it('accepts new work', () => {
    const queue = new PriorityQueue<Item>(10, [])

    queue.pushWithBackoff({ id: 'abc' })
    queue.pushWithBackoff({ id: 'cde' })

    expect(queue.length).toBe(2)
    expect(queue.todo).toBe(2)
  })

  it('ignores when item has not been worked on', () => {
    const queue = new PriorityQueue<Item>(10, [])

    expect(queue.pushWithBackoff({ id: 'abc' })).toBe(true)
    expect(queue.pushWithBackoff({ id: 'abc' })).toBe(false)
    expect(queue.length).toBe(1)
    expect(queue.todo).toBe(1)
  })

  it('schedules as future work when item returns to the queue', () => {
    const queue = new PriorityQueue<Item>(10, [])

    queue.pushWithBackoff({ id: 'abc' })
    queue.pop()

    // accepted work
    expect(queue.pushWithBackoff({ id: 'abc' })).toBe(true)

    // not in the main queue yet
    expect(queue.length).toBe(0)

    // present in future work
    expect(queue.todo).toBe(1)
    expect(queue.includes({ id: 'abc' })).toBe(true)
  })

  it('schedules as future work for later', () => {
    jest.useFakeTimers()
    const spy = jest.spyOn(global, 'setTimeout')

    const queue = new PriorityQueue<Item>(10, [])

    queue.pushWithBackoff({ id: 'abc' })
    expect(spy).not.toHaveBeenCalled()

    queue.pop()

    queue.pushWithBackoff({ id: 'abc' })
    expect(spy).toHaveBeenCalled()

    const delay = spy.mock.calls[0][1]
    expect(delay).toBeGreaterThan(1000)
  })

  it('increases the delay as work gets requeued', () => {
    jest.useFakeTimers()
    const spy = jest.spyOn(global, 'setTimeout')

    const queue = new PriorityQueue<Item>(10, [])

    queue.pushWithBackoff({ id: 'abc' })
    jest.advanceTimersToNextTimer()
    queue.pop()

    queue.pushWithBackoff({ id: 'abc' })
    jest.advanceTimersToNextTimer()
    queue.pop()

    queue.pushWithBackoff({ id: 'abc' })
    jest.advanceTimersToNextTimer()
    queue.pop()

    queue.pushWithBackoff({ id: 'abc' })
    jest.advanceTimersToNextTimer()
    queue.pop()

    const firstDelay = spy.mock.calls[0][1]
    expect(firstDelay).toBeGreaterThan(1000)

    const secondDelay = spy.mock.calls[1][1]
    expect(secondDelay).toBeGreaterThan(2000)

    const thirdDelay = spy.mock.calls[2][1]
    expect(thirdDelay).toBeGreaterThan(3000)
  })
})

describe('Seen map clean up', () => {
  let queue!: PriorityQueue<Item>
  beforeEach(() => {
    jest.useFakeTimers()
    queue = new PriorityQueue<Item>(MAX_RETRIES, [])
  })
  const MAX_RETRIES = 3
  const MAX_TOTAL_RETRY_TIME = calculateMaxTotalRetryTime(MAX_RETRIES)

  it('clear expired on pop', async () => {
    queue.push({ id: 'abc' })

    jest.advanceTimersByTime(MAX_TOTAL_RETRY_TIME / 2)
    // retry time has advanced half way, element should still be in "seen"
    expect('abc' in queue['seen']).toBeTruthy()

    jest.advanceTimersByTime(MAX_TOTAL_RETRY_TIME / 2)
    // total retry time should be exceeded, garbage collection should happen on pop()
    queue.pop()

    expect('abc' in queue['seen']).toBeFalsy()
  })

  it('clear expired on push', async () => {
    queue.push({ id: 'abc' })
    jest.advanceTimersByTime(MAX_TOTAL_RETRY_TIME / 2)
    expect('abc' in queue['seen']).toBeTruthy()
    jest.advanceTimersByTime(MAX_TOTAL_RETRY_TIME / 2)
    queue.push({ id: 'def' })
    expect('abc' in queue['seen']).toBeFalsy()
  })

  it('should update "lastSeen" on every push', () => {
    queue.push({ id: 'abc' })
    const lastSeen1 = queue['seen']['abc'].expiration
    jest.advanceTimersByTime(99)

    queue.pop()
    queue.push({ id: 'abc' })

    const lastSeen2 = queue['seen']['abc'].expiration
    expect(lastSeen2).toBeGreaterThan(lastSeen1)
  })

  it('should update lastSeen even if retries have been exhausted....', () => {
    queue.push({ id: 'abc' })
    const lastSeen1 = queue['seen']['abc'].expiration
    jest.advanceTimersByTime(99)

    queue.pop()
    queue.push({ id: 'abc' })
    queue.pop()
    queue.push({ id: 'abc' })
    queue.pop()
    queue.push({ id: 'abc' })

    const lastSeen2 = queue['seen']['abc'].expiration
    expect(lastSeen2).toBeGreaterThan(lastSeen1)
  })
})
