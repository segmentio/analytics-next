import fs from 'fs'
import path from 'path'

const PATH = 'e2e-tests/data/requests/'

const getFileContent = (file: string): JSONRequests => {
  const filePath = path.join(PATH, file)
  const jsonString = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(jsonString)
}

const cleanUp = (param: JSONRequests): object => {
  const reqs: JSONRequests = {
    ...param,
    trackingAPI: param.trackingAPI.map((r) => {
      let postData = undefined
      if (r.postData) {
        postData = { ...r.postData }

        // delete time/date fields
        delete postData.sentAt
        delete postData.timestamp

        // replace randomly generated values
        postData.anonymousId = 'anon'
        postData.messageId = 'messageId'

        if (postData.context.externalIds) {
          postData.context.externalIds.forEach((externalId) => {
            externalId.id = 'random'
          })
        }

        if (postData.traits) {
          postData.traits.crossDomainId = 'crossDomainId'
        }

        if (postData.context.traits) {
          postData.context.traits.crossDomainId = 'crossDomainId'
        }

        // delete AJSN-only fields
        delete postData.context.metrics
        delete postData.context.attempts

        // library will obviously be different (ajs classic vs ajs next)
        delete postData.context.library
      }

      delete r.headers.accept
      delete r.headers.origin

      return {
        ...r,
        postData,
      }
    }),
  }

  return reqs
}

describe('Compare requests', () => {
  const files = fs.readdirSync(PATH)

  const classicScenarios = files
    .filter((fileName) => fileName.includes('classic'))
    .map((fileName) => ({
      fileName,
      content: getFileContent(fileName),
    }))

  const nextScenarios = files
    .filter((fileName) => fileName.includes('next'))
    .map((fileName) => ({
      fileName,
      content: getFileContent(fileName),
    }))

  classicScenarios.forEach((classicScenario) => {
    // considering all scenarios are named "AJS_VERSION-scenario_name". Eg "classic-staples"
    const nextScenario = nextScenarios.find((scenario) => scenario.fileName.includes(classicScenario.fileName.split('-')[1]))

    it(`compares classic and next recorded requests`, () => {
      const classic = cleanUp(classicScenario.content)
      const next = cleanUp(nextScenario!.content)

      expect(classic).toEqual(next)
    })
  })
})

interface JSONRequests {
  name: string
  trackingAPI: TrackingAPI[]
}

interface TrackingAPI {
  method: string
  url: string
  postData?: PostData
  headers: {
    'content-type': string
    'user-agent': string
    referer: string
    origin?: string
    accept?: string
  }
}

interface PostData {
  integrations: object
  anonymousId: string
  type: string
  properties?: Properties
  name?: string
  context: Context
  messageId: string
  timestamp?: string
  writeKey: string
  userId?: string
  sentAt?: string
  traits?: Traits
}

interface Context {
  attempts?: number
  metrics?: object[]
  userAgent: string
  locale: string
  library?: Library
  page?: Properties
  externalIds?: ExternalID[]
  traits?: Traits
}

interface ExternalID {
  id: string
  type: string
  collection: string
  encoding: string
}

interface Library {
  name: string
  version?: string
}

interface Properties {
  path: string
  referrer: string
  search: string
  title: string
  url: string
}

interface Traits {
  crossDomainId: string
}
