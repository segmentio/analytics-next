import { SignalsSettingsConfig } from '@segment/analytics-signals/dist/types/core/signals'

// This is for testing with the global sandbox strategy with an npm script, that executes processSignal in the global scope
// If we change this to be the default, this can be rejiggered
const SANDBOX_STRATEGY = (process.env.SANDBOX_STRATEGY ??
  'iframe') as SignalsSettingsConfig['sandboxStrategy']

export const envConfig = {
  SANDBOX_STRATEGY,
}
