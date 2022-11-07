import { CoreContext } from '@segment/analytics-core'

it('should be able to import and instantiate some module from core', () => {
  // Test the ability to do basic imports
  expect(typeof new CoreContext({ type: 'alias' })).toBe('object')
})
