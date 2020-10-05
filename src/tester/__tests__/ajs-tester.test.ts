import { tester } from '../ajs-tester'

describe('Tester', () => {
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

    await analyticsStub.puppeteerPage.close()
  })
})
