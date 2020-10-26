import { postToTrackingAPI } from '../api'
import { mocked } from 'ts-jest/utils'
import nodefetch from 'node-fetch'

jest.mock('node-fetch', () => {
  return jest.fn()
})

const postMessage = Promise.resolve({
  json: () => Promise.resolve({ status: 200 }),
})

describe(postToTrackingAPI, () => {
  beforeEach(async () => {
    jest.resetAllMocks()
  })

  /* eslint-disable @typescript-eslint/ban-ts-ignore */
  // @ts-ignore: ignore Response required fields
  mocked(nodefetch).mockImplementation((): Promise<Response> => postMessage)

  it('calls trackingApi and returns the event', async () => {
    const event = await postToTrackingAPI(
      {
        type: 'track',
      },
      'abc123'
    )

    expect(event).toBeDefined()
    expect(nodefetch).toHaveBeenCalled()
  })
})
