interface Metric {
  metric: string
  value: number
  type: 'gauge' | 'increment'
  tags: string[]
}

export default class Stats {
  metrics: Metric[] = []

  increment(metric: string, by = 1, tags?: string[]): void {
    this.metrics.push({
      metric,
      value: by,
      tags: tags ?? [],
      type: 'increment',
    })
  }

  gauge(metric: string, value: number, tags?: string[]): void {
    this.metrics.push({
      metric,
      value,
      tags: tags ?? [],
      type: 'gauge',
    })
  }

  flush(): void {
    const formatted = this.metrics.map((m) => ({ ...m, tags: m.tags.join(',') }))
    console.table(formatted)
    // TODO: flush stats
    this.metrics = []
  }
}
