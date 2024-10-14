export const SignalType = Object.freeze({
  Interaction: 'interaction',
  Navigation: 'navigation',
  Network: 'network',
  LocalData: 'localData',
  Instrumentation: 'instrumentation',
  UserDefined: 'userDefined',
})

export const EventType = Object.freeze({
  Track: 'track',
  Page: 'page',
  Screen: 'screen',
  Identify: 'identify',
  Group: 'group',
  Alias: 'alias',
})

export const NavigationAction = Object.freeze({
  Forward: 'forward',
  Backward: 'backward',
  Modal: 'modal',
  Entering: 'entering',
  Leaving: 'leaving',
  Page: 'page',
  Popup: 'popup',
})

export const NetworkAction = Object.freeze({
  Request: 'request',
  Response: 'response',
})

export const LocalDataAction = Object.freeze({
  Loaded: 'loaded',
  Updated: 'updated',
  Saved: 'saved',
  Deleted: 'deleted',
  Undefined: 'undefined',
})
