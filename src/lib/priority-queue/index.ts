type WithID = {
  id: string
}

export class PriorityQueue<T extends WithID> {
  private queue: T[]
  private maxAttempts: number
  private seen: Record<string, number>

  constructor(maxAttempts: number, queue: T[]) {
    this.maxAttempts = maxAttempts
    this.queue = queue
    this.seen = {}
  }

  push(...operations: T[]): void {
    operations.forEach((operation) => {
      const attempts = this.updateAttempts(operation)
      if (attempts > this.maxAttempts || this.includes(operation)) {
        return
      }

      this.queue.push(operation)
    })

    this.queue = this.queue.sort((a, b) => this.getAttempts(a) - this.getAttempts(b))
  }

  public getAttempts(operation: T): number {
    return this.seen[operation.id] ?? 0
  }

  private updateAttempts(operation: T): number {
    this.seen[operation.id] = this.getAttempts(operation) + 1
    return this.getAttempts(operation)
  }

  includes(operation: T): boolean {
    return this.queue.includes(operation) || Boolean(this.queue.find((i) => i.id === operation.id))
  }

  pop(): T | undefined {
    return this.queue.shift()
  }

  public get length(): number {
    return this.queue.length
  }
}
