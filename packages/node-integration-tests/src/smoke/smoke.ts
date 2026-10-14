import { default as AnalyticsDefaultImport } from '@fernohq/analytics-node'
import { Analytics as AnalyticsNamedImport } from '@fernohq/analytics-node'

{
  // test named imports vs default imports
  new AnalyticsNamedImport({ writeKey: 'hello world' })
  new AnalyticsDefaultImport({ writeKey: 'hello world' })
}
