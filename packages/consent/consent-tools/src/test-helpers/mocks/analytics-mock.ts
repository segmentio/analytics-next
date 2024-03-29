import { AnyAnalytics } from '../../types'

export const analyticsMock: jest.Mocked<AnyAnalytics> = {
  addSourceMiddleware: jest.fn(),
  page: jest.fn(),
  load: jest.fn(),
  on: jest.fn(),
  track: jest.fn(),
}
