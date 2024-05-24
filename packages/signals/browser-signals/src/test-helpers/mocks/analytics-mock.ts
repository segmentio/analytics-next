import { AnyAnalytics } from '../../types'

export const analyticsMock: jest.Mocked<AnyAnalytics> = {
  addSourceMiddleware: jest.fn(),
  track: jest.fn(),
}
