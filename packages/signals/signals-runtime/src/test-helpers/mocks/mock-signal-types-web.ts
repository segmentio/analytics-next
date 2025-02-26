import {
  InteractionSignal,
  NavigationSignal,
  InstrumentationSignal,
  UserDefinedSignal,
  NetworkSignal,
  PageData,
} from '../../web/web-signals-types'
// Mock data for testing

export const mockPageData: PageData = {
  url: 'https://www.segment.com/docs/connections/sources/catalog/libraries/website/javascript/',
  path: '/docs/connections/sources/catalog/libraries/website/javascript/',
  search: '',
  hostname: 'www.segment.com',
  hash: '',
  referrer: '',
  title: 'Segment - Documentation',
}

export const mockInteractionSignal: InteractionSignal = {
  type: 'interaction',
  data: {
    page: mockPageData,
    eventType: 'click',
    target: {
      id: 'button1',
      className: 'btn-primary',
      attributes: { id: 'button1', class: 'btn-primary' },
    },
  },
  metadata: { timestamp: Date.now() },
}

export const mockNavigationSignal: NavigationSignal = {
  type: 'navigation',
  data: {
    page: mockPageData,
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
    page: mockPageData,
    rawEvent: { type: 'customEvent', detail: 'example' },
  },
  metadata: { timestamp: Date.now() },
}

export const mockNetworkSignal: NetworkSignal = {
  type: 'network',
  data: {
    page: mockPageData,
    action: 'request',
    contentType: 'application/json',
    url: 'https://api.example.com/data',
    method: 'GET',
    data: { key: 'value' },
  },
  metadata: { timestamp: Date.now() },
}

export const mockUserDefinedSignal: UserDefinedSignal = {
  type: 'userDefined',
  data: {
    page: mockPageData,
    customField: 'customValue',
  },
  metadata: { timestamp: Date.now() },
}
