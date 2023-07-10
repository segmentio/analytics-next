import { clientHints } from '..'
import {
  highEntropyTestData,
  lowEntropyTestData,
} from '../../../test-helpers/fixtures/client-hints'
import { UADataValues } from '../interfaces'

describe('Client Hints API', () => {
  beforeEach(() => {
    ;(window.navigator as any).userAgentData = {
      ...lowEntropyTestData,
      getHighEntropyValues: jest
        .fn()
        .mockImplementation((hints: string[]): Promise<UADataValues> => {
          let result = {}
          Object.entries(highEntropyTestData).forEach(([k, v]) => {
            if (hints.includes(k)) {
              result = {
                ...result,
                [k]: v,
              }
            }
          })
          return Promise.resolve({
            ...lowEntropyTestData,
            ...result,
          })
        }),
      toJSON: jest.fn(() => {
        return lowEntropyTestData
      }),
    }
  })

  it('uses API when available', async () => {
    let userAgentData = await clientHints()
    expect(userAgentData).toEqual(lowEntropyTestData)
    ;(window.navigator as any).userAgentData = undefined
    userAgentData = await clientHints()
    expect(userAgentData).toBe(undefined)
  })

  it('always gets low entropy hints', async () => {
    const userAgentData = await clientHints()
    expect(userAgentData).toEqual(lowEntropyTestData)
  })

  it('gets low entropy hints when client rejects high entropy promise', async () => {
    ;(window.navigator as any).userAgentData = {
      ...lowEntropyTestData,
      getHighEntropyValues: jest.fn(() => Promise.reject()),
      toJSON: jest.fn(() => lowEntropyTestData),
    }

    const userAgentData = await clientHints(['bitness'])
    expect(userAgentData).toEqual(lowEntropyTestData)
  })

  it('gets specified high entropy hints', async () => {
    const userAgentData = await clientHints(['bitness'])
    expect(userAgentData).toEqual({
      ...lowEntropyTestData,
      bitness: '64',
    })
  })
})
