import '../../test-helpers/onetrust-globals.js'

import { getConsentedGroupIds, getGroupDataFromGroupIds } from '../onetrust-api'
import { OneTrustMockGlobal } from '../../test-helpers/mocks'

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

describe(getGroupDataFromGroupIds, () => {
  it('should partition groups into consent/deny', () => {
    window.OnetrustActiveGroups = ',C0001,C0004'
    window.OneTrust = {
      ...OneTrustMockGlobal,
      GetDomainData: () => ({
        Groups: [
          {
            CustomGroupId: 'C0001',
          },
          {
            CustomGroupId: 'C0004',
          },
          {
            CustomGroupId: 'SOME_OTHER_GROUP',
          },
        ],
      }),
    }
    const data = getGroupDataFromGroupIds()

    expect(data.userSetConsentGroups).toEqual([
      {
        groupId: 'C0001',
      },
      {
        groupId: 'C0004',
      },
    ])

    expect(data.userDeniedConsentGroups).toEqual([
      {
        groupId: 'SOME_OTHER_GROUP',
      },
    ])
  })
})
