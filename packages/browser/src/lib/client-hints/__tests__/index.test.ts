import { clientHints } from '..'

export const userAgentTestData = {
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

const testHighEntropyValues = {
  architecture: 'x86',
  bitness: '64',
}

describe('Client Hints API', () => {
  beforeEach(() => {
    // @ts-expect-error
    navigator.userAgentData = {
      ...userAgentTestData,
      getHighEntropyValues: jest.fn((hints: string[]) => {
        let result = {}
        Object.entries(testHighEntropyValues).forEach(([k, v]) => {
          if (hints.includes(k)) {
            result = {
              ...result,
              [k]: v,
            }
          }
        })
        return {
          ...userAgentTestData,
          ...result,
        }
      }),
    }
  })

  it('uses API when available', async () => {
    let userAgentData = await clientHints()
    expect(userAgentData).toEqual(userAgentTestData)

    // @ts-expect-error
    navigator.userAgentData = undefined
    userAgentData = await clientHints()
    expect(userAgentData).toBe(undefined)
  })

  it('always gets low entropy hints', async () => {
    const userAgentData = await clientHints()
    expect(userAgentData).toEqual(userAgentTestData)
  })

  it('gets low entropy hints when client rejects high entropy promise', async () => {
    // @ts-expect-error
    navigator.userAgentData = {
      ...userAgentTestData,
      getHighEntropyValues: jest.fn(() => Promise.reject()),
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
