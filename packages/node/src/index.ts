export {
  Analytics,
  Context,
  Plugin,
  ExtraContext,
  Traits,
} from './app/analytics-node'
export type { AnalyticsSettings } from './app/settings'

// export Analytics as both a named export and a default export (for backwards-compat. reasons)
import { Analytics } from './app/analytics-node'
export default Analytics
