/**
 * This is the public API for this package.
 * We avoid using splat (*) exports so that we can control what is exposed.
 */
export * from './types/web/signals'
import { SignalsRuntimeAPI } from './types/web/signals'
declare global {
  interface Window {
    signals: SignalsRuntimeAPI
    SignalType: {
      Interaction: 'interaction'
      Navigation: 'navigation'
      Network: 'network'
      LocalData: 'localData'
      Instrumentation: 'instrumentation'
      UserDefined: 'userDefined'
    }
    EventType: {
      Track: 'track'
      Page: 'page'
      Screen: 'screen'
      Identify: 'identify'
      Group: 'group'
      Alias: 'alias'
    }
    NavigationAction: {
      URLChange: 'urlChange'
      PageLoad: 'pageLoad'
    }
  }
}
