import {
  InteractionSignal,
  NavigationSignal,
  InstrumentationSignal,
  UserDefinedSignal,
  NetworkSignal,
} from '../../web/web-signals-types'
// Mock data for testing
export const mockInteractionSignal: InteractionSignal = {
  type: 'interaction',
  data: {
    eventType: 'click',
    target: { id: 'button1', className: 'btn-primary' },
  },
  metadata: { timestamp: Date.now() },
}

export const mockNavigationSignal: NavigationSignal = {
  type: 'navigation',
  data: {
    action: 'urlChange',
    url: 'https://example.com',
    hash: '#section1',
    prevUrl: 'https://example.com/home',
  },
  metadata: { timestamp: Date.now() },
}

export const mockInstrumentationSignal: InstrumentationSignal = {
  type: 'instrumentation',
  data: {
    rawEvent: { type: 'customEvent', detail: 'example' },
  },
  metadata: { timestamp: Date.now() },
}

export const mockNetworkSignal: NetworkSignal = {
  type: 'network',
  data: {
    action: 'request',
    url: 'https://api.example.com/data',
    method: 'GET',
    data: { key: 'value' },
  },
  metadata: { timestamp: Date.now() },
}

export const mockUserDefinedSignal: UserDefinedSignal = {
  type: 'userDefined',
  data: {
    customField: 'customValue',
  },
  metadata: { timestamp: Date.now() },
}
