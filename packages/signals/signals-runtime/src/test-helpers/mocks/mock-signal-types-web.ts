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
}

export const mockNavigationSignal: NavigationSignal = {
  type: 'navigation',
  data: {
    action: 'urlChange',
    url: 'https://example.com',
    hash: '#section1',
    prevUrl: 'https://example.com/home',
  },
}

export const mockInstrumentationSignal: InstrumentationSignal = {
  type: 'instrumentation',
  data: {
    rawEvent: { type: 'customEvent', detail: 'example' },
  },
}

export const mockNetworkSignal: NetworkSignal = {
  type: 'network',
  data: {
    action: 'request',
    contentType: 'application/json',
    url: 'https://api.example.com/data',
    method: 'GET',
    data: { key: 'value' },
  },
}

export const mockUserDefinedSignal: UserDefinedSignal = {
  type: 'userDefined',
  data: {
    customField: 'customValue',
  },
}
