import { createTestAnalytics } from './test-helpers/create-test-analytics'

// This is a smoke test.
// More detailed tests can be found in packages/core/src/validation/__tests__/assertions.test.ts
describe('Argument validation', () => {
  it('should throw an error if userId/anonId/groupId is not specified', async () => {
    const analytics = createTestAnalytics()

    expect(() =>
      analytics.track({
        event: 'foo',
        anonymousId: undefined as any,
        userId: undefined as any,
      })
    ).toThrow(/userId/)
  })
})
