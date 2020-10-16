import { tester, testerTeardown } from '../ajs-tester'

describe('Tester', () => {
  afterAll(async () => {
    await testerTeardown()
  })

  it('loads ajs in a browser', async () => {
    jest.setTimeout(10000)
    const analyticsStub = await tester('***REMOVED***')

    const ctx = await analyticsStub.track('hi', {
      test: 'prop',
    })

    expect(ctx.event.event).toEqual('hi')
    expect(ctx.event.properties).toEqual({
      test: 'prop',
    })

    await analyticsStub.browserPage.close()
  })
})
