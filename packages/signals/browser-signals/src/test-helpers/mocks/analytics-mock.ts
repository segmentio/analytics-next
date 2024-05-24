import { AnyAnalytics } from '../../types'

export const analyticsMock: jest.Mocked<AnyAnalytics> = {
  settings: {
    writeKey: 'test',
    cdnSettings: {
      edgeFunction: {
        url: 'https://foo.com',
        version: '1.0.0',
      },
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
