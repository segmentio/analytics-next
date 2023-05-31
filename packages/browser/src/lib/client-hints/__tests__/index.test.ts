import { clientHints } from '..'
import { UADataValues, UALowEntropyJSON } from '../interfaces'

export const userAgentTestData: UALowEntropyJSON = {
  brands: [
    {
      brand: 'Google Chrome',
      version: '113',
    },
    {
      brand: 'Chromium',
      version: '113',
    },
    {
      brand: 'Not-A.Brand',
      version: '24',
    },
  ],
  mobile: false,
  platform: 'macOS',
}

export const testHighEntropyValues: UADataValues = {
  architecture: 'x86',
  bitness: '64',
}

describe('Client Hints API', () => {
  beforeEach(() => {
    navigator.userAgentData = {
      ...userAgentTestData,
      getHighEntropyValues: jest
        .fn()
        .mockImplementation((hints: string[]): Promise<UADataValues> => {
          let result = {}
          Object.entries(testHighEntropyValues).forEach(([k, v]) => {
            if (hints.includes(k)) {
              result = {
                ...result,
                [k]: v,
              }
            }
          })
          return Promise.resolve({
            ...userAgentTestData,
            ...result,
          })
        }),
      toJSON: jest.fn(() => userAgentTestData),
    }
  })

  it('uses API when available', async () => {
    let userAgentData = await clientHints()
    expect(userAgentData).toEqual(userAgentTestData)

    navigator.userAgentData = undefined
    userAgentData = await clientHints()
    expect(userAgentData).toBe(undefined)
  })

  it('always gets low entropy hints', async () => {
    const userAgentData = await clientHints()
    expect(userAgentData).toEqual(userAgentTestData)
  })

  it('gets low entropy hints when client rejects high entropy promise', async () => {
    navigator.userAgentData = {
      ...userAgentTestData,
      getHighEntropyValues: jest.fn(() => Promise.reject()),
      toJSON: jest.fn(() => userAgentTestData),
    }

    const userAgentData = await clientHints(['bitness'])
    expect(userAgentData).toEqual(userAgentTestData)
  })

  it('gets specified high entropy hints', async () => {
    const userAgentData = await clientHints(['bitness'])
    expect(userAgentData).toEqual({
      ...userAgentTestData,
      bitness: '64',
    })
  })
})
