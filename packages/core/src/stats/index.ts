type MetricType = CoreMetricType

type CompactMetricType = 'g' | 'c'

export type CoreMetricType = 'gauge' | 'counter'

export interface CoreMetric {
  metric: string
  value: number
  type: CoreMetricType
  tags: string[]
  timestamp: number // unit milliseconds
}

export interface CoreRemoteMetrics {
  increment(metric: string, tags: string[]): void
}

export interface CompactMetric {
  m: string // metric name
  v: number // value
  k: CompactMetricType
  t: string[] // tags
  e: number // timestamp in unit milliseconds
}

const compactMetricType = (type: MetricType): CompactMetricType => {
  const enums: Record<MetricType, CompactMetricType> = {
    gauge: 'g',
    counter: 'c',
  }
  return enums[type]
}

export class Stats {
  metrics: CoreMetric[] = []

  private remoteMetrics?: CoreRemoteMetrics

  constructor(remoteMetrics?: CoreRemoteMetrics) {
    this.remoteMetrics = remoteMetrics
  }

  increment(metric: string, by = 1, tags?: string[]): void {
    this.metrics.push({
      metric,
      value: by,
      tags: tags ?? [],
      type: 'counter',
      timestamp: Date.now(),
    })

    void this.remoteMetrics?.increment(metric, tags ?? [])
  }

  gauge(metric: string, value: number, tags?: string[]): void {
    this.metrics.push({
      metric,
      value,
      tags: tags ?? [],
      type: 'gauge',
      timestamp: Date.now(),
    })
  }

  flush(): void {
    const formatted = this.metrics.map((m) => ({
      ...m,
      tags: m.tags.join(','),
    }))
    // ie doesn't like console.table
    if (console.table) {
      console.table(formatted)
    } else {
      console.log(formatted)
    }
    this.metrics = []
  }

  /**
   * compact keys for smaller payload
   */
  serialize(): CompactMetric[] {
    return this.metrics.map((m) => {
      return {
        m: m.metric,
        v: m.value,
        t: m.tags,
        k: compactMetricType(m.type),
        e: m.timestamp,
      }
    })
  }
}

export class NullStats implements Stats {
  metrics = []
  gauge(..._args: Parameters<Stats['gauge']>) {}
  increment(..._args: Parameters<Stats['increment']>) {}
  flush(..._args: Parameters<Stats['flush']>) {}
  serialize(..._args: Parameters<Stats['serialize']>) {
    return []
  }
}
