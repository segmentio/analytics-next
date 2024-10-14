export const EventType = Object.freeze({
  Track: 'track',
  Page: 'page',
  Screen: 'screen',
  Identify: 'identify',
  Group: 'group',
  Alias: 'alias',
})

export const NavigationAction = Object.freeze({
  URLChange: 'urlChange',
  PageLoad: 'pageLoad',
})

export const SignalType = Object.freeze({
  Interaction: 'interaction',
  Navigation: 'navigation',
  Network: 'network',
  LocalData: 'localData',
  Instrumentation: 'instrumentation',
  UserDefined: 'userDefined',
})
