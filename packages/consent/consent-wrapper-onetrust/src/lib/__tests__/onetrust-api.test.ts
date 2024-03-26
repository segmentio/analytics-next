import '../../test-helpers/onetrust-globals.d.ts'

import {
  getConsentedGroupIds,
  getGroupDataFromGroupIds,
  getNormalizedCategoriesFromGroupData,
  getOneTrustActiveGroups,
  getNormalizedCategoriesFromGroupIds,
  getOneTrustGlobal,
  getAllGroups,
} from '../onetrust-api'
import { domainDataMock, OneTrustMockGlobal } from '../../test-helpers/mocks'
import { OneTrustApiValidationError } from '../validation'

beforeEach(() => {
  // @ts-ignore
  delete window.OneTrustActiveGroups
  // @ts-ignore
  delete window.OneTrust
})

describe(getOneTrustGlobal, () => {
  it('should get the global', () => {
    ;(window as any).OneTrust = OneTrustMockGlobal
    expect(getOneTrustGlobal()).toEqual(OneTrustMockGlobal)
  })

  it('should handle null or undefined', () => {
    ;(window as any).OneTrust = undefined
    expect(getOneTrustGlobal()).toBeUndefined()
    ;(window as any).OneTrust = null
    expect(getOneTrustGlobal()).toBeUndefined()
  })

  it('should log an error if the global is an unexpected type', () => {
    ;(window as any).OneTrust = {}
    expect(getOneTrustGlobal()).toBeUndefined()
  })
})

describe(getAllGroups, () => {
  it('works if OneTrust global is not available', () => {
    ;(window as any).OneTrust = undefined
    expect(getAllGroups()).toEqual([])
  })
  it('get the normalized groups', () => {
    ;(window as any).OneTrust = OneTrustMockGlobal
    window.OneTrust = {
      ...OneTrustMockGlobal,
      GetDomainData: () => ({
        ...domainDataMock,
        Groups: [
          {
            CustomGroupId: 'C0001',
          },
          {
            CustomGroupId: 'C0004',
          },
          {
            CustomGroupId: '  C0005',
          },
          {
            CustomGroupId: 'C0006  ',
          },
        ],
      }),
    }
    expect(getAllGroups()).toEqual([
      { groupId: 'C0001' },
      { groupId: 'C0004' },
      { groupId: 'C0005' },
      { groupId: 'C0006' },
    ])
  })
})

describe(getNormalizedCategoriesFromGroupData, () => {
  it('should return a set of groups', () => {
    expect(
      getNormalizedCategoriesFromGroupData({
        userSetConsentGroups: [{ groupId: 'C0003' }],
        userDeniedConsentGroups: [{ groupId: 'C0001' }, { groupId: 'C0002' }],
      })
    ).toEqual({ C0003: true, C0001: false, C0002: false })
  })
})

describe(getOneTrustActiveGroups, () => {
  it('should return the global string', () => {
    window.OnetrustActiveGroups = 'hello'
    expect(getOneTrustActiveGroups()).toBe('hello')
  })
  it('should return undefined if no groups are defined', () => {
    // @ts-ignore
    window.OnetrustActiveGroups = undefined
    expect(getOneTrustActiveGroups()).toBe(undefined)

    // @ts-ignore
    window.OnetrustActiveGroups = null
    expect(getOneTrustActiveGroups()).toBe(undefined)

    window.OnetrustActiveGroups = ''
    expect(getOneTrustActiveGroups()).toBe(undefined)
  })

  it('should throw an error if OneTrustActiveGroups is invalid', () => {
    // @ts-ignore
    window.OnetrustActiveGroups = []
    expect(() => getOneTrustActiveGroups()).toThrow(OneTrustApiValidationError)
  })
})

describe(getConsentedGroupIds, () => {
  it('should normalize groupIds', () => {
    expect(getConsentedGroupIds(',C0001,')).toEqual(['C0001'])
    expect(getConsentedGroupIds('C0001,C0004')).toEqual(['C0001', 'C0004'])
    expect(getConsentedGroupIds(',C0001,C0004')).toEqual(['C0001', 'C0004'])
    expect(getConsentedGroupIds(',')).toEqual([])
    expect(getConsentedGroupIds('')).toEqual([])
    expect(getConsentedGroupIds(',,')).toEqual([])
  })

  it('should return an empty array if no groups are defined', () => {
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
        ...domainDataMock,
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

describe(getNormalizedCategoriesFromGroupIds, () => {
  it('should get normalized categories', () => {
    window.OneTrust = {
      ...OneTrustMockGlobal,
      GetDomainData: () => ({
        ...domainDataMock,
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
    const ids = getNormalizedCategoriesFromGroupIds(['C0001'])
    expect(ids).toEqual({ C0001: true, C0004: false, SOME_OTHER_GROUP: false })
  })
})
