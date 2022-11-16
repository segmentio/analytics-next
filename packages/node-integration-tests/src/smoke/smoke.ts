import { default as AnalyticsDefaultImport } from '@segment/analytics-node'
import { Analytics as AnalyticsNamedImport } from '@segment/analytics-node'

{
  // test named imports vs default imports
  new AnalyticsNamedImport({ writeKey: 'hello world' })
  new AnalyticsDefaultImport({ writeKey: 'hello world' })
}
