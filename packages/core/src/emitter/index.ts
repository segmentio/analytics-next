export class Emitter<EventName extends string = string> {
  private callbacks: Partial<Record<EventName, Function[]>> = {}

  on(event: EventName, callback: Function): this {
    this.callbacks[event] = [...(this.callbacks[event] ?? []), callback]
    return this
  }

  once(event: EventName, fn: Function): this {
    const on = (...args: unknown[]): void => {
      this.off(event, on)
      fn.apply(this, args)
    }

    this.on(event, on)
    return this
  }

  off(event: EventName, callback: Function): this {
    const fns = this.callbacks[event] ?? []
    const without = fns.filter((fn) => fn !== callback)
    this.callbacks[event] = without
    return this
  }

  emit(event: EventName, ...args: unknown[]): this {
    const callbacks = this.callbacks[event] ?? []
    callbacks.forEach((callback) => {
      callback.apply(this, args)
    })
    return this
  }
}
