import './onetrust-globals.d.ts'

import { getConsentedGroupIds, getGroupData } from '../onetrust-api'

beforeEach(() => {
  // @ts-ignore
  delete window.OneTrustActiveGroups
  // @ts-ignore
  delete window.OneTrust
})

describe(getConsentedGroupIds, () => {
  it('should return formatted groups', () => {
    window.OnetrustActiveGroups = ',C0001,C0004,C0003,STACK42,'
    expect(getConsentedGroupIds()).toEqual([
      'C0001',
      'C0004',
      'C0003',
      'STACK42',
    ])
  })
  it('should work even without the strange leading/trailing commas that onetrust adds', () => {
    window.OnetrustActiveGroups = 'C0001,C0004'
    expect(getConsentedGroupIds()).toEqual(['C0001', 'C0004'])
  })

  it('should return an array with only 1 active group if that is the only one consented', () => {
    window.OnetrustActiveGroups = ',C0001,'
    expect(getConsentedGroupIds()).toEqual(['C0001'])
  })

  it('should return an empty array if no groups are defined', () => {
    window.OnetrustActiveGroups = ',,'
    expect(getConsentedGroupIds()).toEqual([])
    window.OnetrustActiveGroups = ','
    expect(getConsentedGroupIds()).toEqual([])
    // @ts-ignore
    window.OnetrustActiveGroups = undefined
    expect(getConsentedGroupIds()).toEqual([])
  })
})

describe(getGroupData, () => {
  it('should partition groups into consent/deny', () => {
    window.OnetrustActiveGroups = ',C0001,C0004'
    window.OneTrust = {
      ...window.OneTrust,
      GetDomainData: () => ({
        Groups: [
          {
            CustomGroupId: 'C0001',
            GroupName: 'Strictly Neccessary Cookies',
          },
          {
            CustomGroupId: 'C0004',
            GroupName: 'Targeting Cookies',
          },
          {
            CustomGroupId: 'SOME_OTHER_GROUP',
            GroupName: 'Some other group',
          },
        ],
      }),
    }
    const data = getGroupData()

    expect(data.userSetConsentGroups).toMatchInlineSnapshot(`
      Array [
        Object {
          "customGroupId": "C0001",
          "groupName": "Strictly Neccessary Cookies",
        },
        Object {
          "customGroupId": "C0004",
          "groupName": "Targeting Cookies",
        },
      ]
    `)
    expect(data.userDeniedConsentGroups).toMatchInlineSnapshot(`
    Array [
      Object {
        "customGroupId": "SOME_OTHER_GROUP",
        "groupName": "Some other group",
      },
    ]
  `)
  })
})
