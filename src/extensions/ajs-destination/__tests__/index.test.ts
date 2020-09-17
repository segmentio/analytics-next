import { Analytics } from '@/core'
import { ajsDestination } from '../index'

const writeKey = '***REMOVED***'

describe('loads a legacy destination', () => {
  it.skip('loads', async () => {
    const fullstory = ajsDestination('fullstory', 'b6a99086c05de0ef7bff')

    const ajs = await Analytics.load({
      writeKey,
      extensions: [fullstory],
    })

    await ajs.track('boo', {
      prop: 1,
    })

    expect(fullstory.track).toHaveBeenCalled()
  })
})
