import { createTestAnalytics } from './test-helpers/create-test-analytics'
describe('Validating events', () => {
  it('should throw an error if userId / groupId is not defined', async () => {
    const analytics = createTestAnalytics()

    expect(() =>
      analytics.track({
        event: 'foo',
        anonymousId: undefined as any,
        userId: undefined as any,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `".userId/anonymousId/previousId/groupId is nil"`
    )
  })
})
