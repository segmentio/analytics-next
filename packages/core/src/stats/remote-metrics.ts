type MetricType = 'gauge' | 'counter'

export interface Metric {
  metric: string
  value: number
  type: MetricType
  tags: string[]
  timestamp: number // unit milliseconds
}

export interface RemoteMetrics {
  sampleRate: number
  increment(metric: string, tags: string[]): Promise<void>
  queue: Metric[]
  flush: Promise<void>
}
