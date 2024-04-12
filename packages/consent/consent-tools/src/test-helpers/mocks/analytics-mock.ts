import { AnyAnalytics } from '../../types'

export const analyticsMock: jest.Mocked<AnyAnalytics> = {
  addDestinationMiddleware: jest.fn(),
  addSourceMiddleware: jest.fn(),
  page: jest.fn(),
  load: jest.fn(),
  track: jest.fn(),
}
