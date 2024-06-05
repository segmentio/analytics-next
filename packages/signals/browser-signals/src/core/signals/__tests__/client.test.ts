import { SignalsClient } from '../client'

import { createSuccess } from '../../../../../../browser/src/test-helpers/factories'
import unfetch from 'unfetch'
jest.mock('unfetch')
jest
  .mocked(unfetch)
  .mockImplementation(() => createSuccess({ integrations: {} }))

describe(SignalsClient, () => {
  let client: SignalsClient

  beforeEach(() => {
    client = new SignalsClient('Test')
  })

  it('return a ctx from track call', () => {
    expect(client).toBeTruthy()
    return expect(client.send('Test', 'Test')).resolves.toMatchObject({
      event: {
        anonymousId: expect.any(String),
        context: expect.any(Object),
        event: 'Segment Signal Generated',
        integrations: {},
        messageId: expect.any(String),
        properties: {
          data: 'Test',
          index: expect.any(Number),
          type: 'Test',
        },
        timestamp: expect.any(Date),
        type: 'track',
      },
    })
  })
})
