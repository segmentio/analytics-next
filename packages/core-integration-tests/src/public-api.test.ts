import { CoreContext } from '@customerio/cdp-analytics-core'

class TestCtx extends CoreContext { }

it('should be able to import and instantiate some module from core', () => {
  // Test the ability to do basic imports
  expect(typeof new TestCtx({ type: 'alias' })).toBe('object')
})
