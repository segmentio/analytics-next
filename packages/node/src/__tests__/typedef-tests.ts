import { AnalyticsNode } from '../'

/**
 * These are general typescript definition tests;
 * They aren't meant to be run by anything but the typescript compiler.
 */
export default {
  'analytics.VERSION should be readonly': () => {
    const analytics = new AnalyticsNode({ writeKey: 'abc' })
    // should work
    analytics.VERSION

    // @ts-expect-error - should not be possible
    analytics.VERSION = 'foo'
  },
}
