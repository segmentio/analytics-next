import { Plugin } from '../../app/types'

export const testPlugin: Plugin = {
  isLoaded: jest.fn().mockReturnValue(true),
  load: jest.fn().mockResolvedValue(undefined),
  unload: jest.fn().mockResolvedValue(undefined),
  name: 'Test Plugin',
  type: 'destination',
  version: '0.1.0',
  alias: jest.fn((ctx) => Promise.resolve(ctx)),
  group: jest.fn((ctx) => Promise.resolve(ctx)),
  identify: jest.fn((ctx) => Promise.resolve(ctx)),
  page: jest.fn((ctx) => Promise.resolve(ctx)),
  screen: jest.fn((ctx) => Promise.resolve(ctx)),
  track: jest.fn((ctx) => Promise.resolve(ctx)),
}
