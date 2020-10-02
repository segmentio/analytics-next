import { PriorityQueue } from '..'

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
