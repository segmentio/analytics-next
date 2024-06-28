import { AnyAnalytics, EdgeFnCDNSettings } from '../../types'

const edgeFnSettings: EdgeFnCDNSettings = {
  downloadURL: 'https://foo.com',
  version: 1,
}

export const analyticsMock: jest.Mocked<AnyAnalytics> = {
  settings: {
    writeKey: 'test',
    cdnSettings: {
      edgeFunction: edgeFnSettings,
      integrations: {},
    },
  },
  alias: jest.fn(),
  identify: jest.fn(),
  screen: jest.fn(),
  group: jest.fn(),
  page: jest.fn(),
  track: jest.fn(),
  addSourceMiddleware: jest.fn(),
}
