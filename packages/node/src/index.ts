export { Analytics, Context } from './app/analytics-node'
export { ExtraContext, Plugin, Traits } from './app/types'
export type { AnalyticsSettings } from './app/settings'

// export Analytics as both a named export and a default export (for backwards-compat. reasons)
import { Analytics } from './app/analytics-node'
export default Analytics
