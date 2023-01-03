export { Analytics } from './app/analytics-node'
export { Context } from './app/context'
export { Plugin, GroupTraits, UserTraits } from './app/types'
export type { AnalyticsSettings } from './app/settings'

// export Analytics as both a named export and a default export (for backwards-compat. reasons)
import { Analytics } from './app/analytics-node'
export default Analytics
