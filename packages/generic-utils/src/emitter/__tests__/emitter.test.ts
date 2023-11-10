import { Emitter } from '../emitter'

describe(Emitter, () => {
  it('emits events', () => {
    const em = new Emitter()

    const fn = jest.fn()
    em.on('test', fn)
    em.emit('test', 'banana')

    expect(fn).toHaveBeenCalledWith('banana')
  })

  it('allows for subscribing to events', () => {
    const em = new Emitter()

    const fn = jest.fn()
    const anotherFn = jest.fn()

    em.on('test', fn)
    em.on('test', anotherFn)

    em.emit('test', 'banana', 'phone')

    expect(fn).toHaveBeenCalledWith('banana', 'phone')
    expect(anotherFn).toHaveBeenCalledWith('banana', 'phone')
  })

  it('allows for subscribing to the same event multiple times', () => {
    const em = new Emitter()

    const fn = jest.fn()

    em.on('test', fn)
    em.emit('test', 'banana')
    em.emit('test', 'phone')

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenCalledWith('banana')
    expect(fn).toHaveBeenCalledWith('phone')
  })

  it('allows for subscribers to subscribe only once', () => {
    const em = new Emitter()

    const fn = jest.fn()
    em.once('test', fn)

    // 2 emits
    em.emit('test', 'banana')
    em.emit('test', 'phone')

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('banana')
  })

  it('allows for unsubscribing', () => {
    const em = new Emitter()

    const fn = jest.fn()
    em.on('test', fn)

    // 2 emits
    em.emit('test', 'banana')
    em.emit('test', 'phone')

    em.off('test', fn)

    // 3rd emit
    em.emit('test', 'phone')

    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('has a default max listeners of 10', () => {
    const em = new Emitter()
    expect(em.maxListenersPerEvent).toBe(10)
  })

  it('should warn if possible memory leak', () => {
    const fn = jest.fn()
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const em = new Emitter({ maxListenersPerEvent: 3 })
    em.on('test', fn)
    em.on('test', fn)
    em.on('test', fn)
    expect(warnSpy).not.toHaveBeenCalled()
    // call on 4th
    em.on('test', fn)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    // do not call additional times
    em.on('test', fn)
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })

  it('has no warning if maxListenersPerEvent is 0', () => {
    const fn = jest.fn()
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const em = new Emitter({ maxListenersPerEvent: 0 })
    expect(em.maxListenersPerEvent).toBe(0)
    em.on('test', fn)
    expect(warnSpy).not.toHaveBeenCalled()
    em.on('test', fn)
    expect(warnSpy).not.toHaveBeenCalled()
  })
})
