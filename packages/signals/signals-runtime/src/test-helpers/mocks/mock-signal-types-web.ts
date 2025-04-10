import { BaseSignal } from '../../shared/shared-types'
import {
  InteractionSignal,
  NavigationSignal,
  InstrumentationSignal,
  UserDefinedSignal,
  NetworkSignal,
  PageData,
} from '../../web/web-signals-types'
// Mock data for testing

type DefaultProps = Pick<BaseSignal, 'anonymousId' | 'timestamp'>

const baseSignalProps: DefaultProps = {
  anonymousId: '123',
  timestamp: '2020-01-01T00:00:00.000Z',
}

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
  ...baseSignalProps,
}

export const mockNavigationSignal: NavigationSignal = {
  type: 'navigation',
  data: {
    action: 'urlChange',
    changedProperties: ['path', 'search', 'hash'],
    page: mockPageData,
    path: '/',
    search: '',
    url: 'https://example.com',
    hash: '#section1',
    prevUrl: 'https://example.com/home',
  },
  ...baseSignalProps,
}

export const mockInstrumentationSignal: InstrumentationSignal = {
  type: 'instrumentation',
  data: {
    page: mockPageData,
    rawEvent: { type: 'customEvent', detail: 'example' },
  },
  ...baseSignalProps,
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
  ...baseSignalProps,
}

export const mockUserDefinedSignal: UserDefinedSignal = {
  type: 'userDefined',
  data: {
    page: mockPageData,
    customField: 'customValue',
  },
  ...baseSignalProps,
}
