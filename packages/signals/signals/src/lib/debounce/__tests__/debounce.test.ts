import { debounceWithKey } from '../index'

jest.useFakeTimers()

describe(debounceWithKey, () => {
  type Callback = (...args: any[]) => void
  let cb: jest.Mock<Callback>
  let debouncedCb: Callback

  beforeEach(() => {
    cb = jest.fn()
    const getKey = (obj: Record<string, any>) => Object.keys(obj)
    debouncedCb = debounceWithKey(cb, getKey, 300)
  })

  test('should call the function after the debounce time', () => {
    debouncedCb({ foo: 1, bar: 2 })
    jest.advanceTimersByTime(200)
    debouncedCb({ baz: 3 })
    jest.advanceTimersByTime(100) // in time for the first call, but not the second
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith({ foo: 1, bar: 2 })
    debouncedCb({ hello: 1, world: 2 }) // just test that a new call does not reset the timer
    jest.advanceTimersByTime(200)
    expect(cb).toHaveBeenCalledTimes(2)
    expect(cb).toHaveBeenCalledWith({ baz: 3 })
    jest.advanceTimersByTime(100)
    expect(cb).toHaveBeenCalledTimes(3)
    expect(cb).toHaveBeenCalledWith({ hello: 1, world: 2 })
  })

  test('should debounce multiple calls with the same key group', () => {
    debouncedCb({ foo: 1, bar: 2 })
    debouncedCb({ foo: 1, bar: 3 })
    jest.advanceTimersByTime(300)
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith({ foo: 1, bar: 3 })
  })

  test('should require the exact same keys for debounce', () => {
    debouncedCb({ foo: 1, bar: 2 })
    debouncedCb({ bar: 6 })
    jest.advanceTimersByTime(300)
    expect(cb).toHaveBeenCalledTimes(2)
    expect(cb).toHaveBeenCalledWith({ foo: 1, bar: 2 })
    expect(cb).toHaveBeenCalledWith({ bar: 6 })
  })
})
