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
        delete postData.sentAt
        delete postData.timestamp
        postData.anonymousId = 'anon'
        postData.messageId = 'messageId'

        if (postData.traits) {
          postData.traits.crossDomainId = 'crossDomainId'
        }

        if (postData.context) {
          postData.context.metrics = []

          if (postData.context.traits) {
            postData.context.traits.crossDomainId = 'crossDomainId'
          }
        }
      }

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
      expect(cleanUp(classicScenario.content)).toEqual(cleanUp(nextScenario!.content))
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
  headers: object
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
  attempts: number
  metrics: object[]
  userAgent: string
  locale: string
  library: Library
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
