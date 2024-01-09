import { Context } from '../context'

export interface RecordIntegrationMetricProps {
  integrationName: string
  methodName: string
  didError?: boolean
  type: 'classic' | 'action'
}

export function recordIntegrationMetric(
  ctx: Context,
  {
    methodName,
    integrationName,
    type,
    didError = false,
  }: RecordIntegrationMetricProps
): void {
  ctx.stats.increment(
    `analytics_js.integration.invoke${didError ? '.error' : ''}`,
    1,
    [
      `method:${methodName}`,
      `integration_name:${integrationName}`,
      `type:${type}`,
    ]
  )
}
