import fs from 'fs-extra'
import path from 'path'
import cleanUp from './cleanUp'
import getFileContent from './getFileContent'

const PATH = path.join(process.cwd(), 'e2e-tests/data/requests/')

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

  test('setup', () => {
    expect(files).not.toBeNull()
  })

  classicScenarios.forEach((classicScenario) => {
    // considering all scenarios are named "AJS_VERSION-scenario_name". Eg "classic-staples"
    const nextScenario = nextScenarios.find((scenario) =>
      scenario.fileName.includes(classicScenario.fileName.split('-')[1])
    )

    it(`compares classic and next recorded requests`, () => {
      const cleanUpClassic = cleanUp(classicScenario.content).trackingAPI
      const cleanUpNext = cleanUp(nextScenario!.content).trackingAPI

      expect(cleanUpClassic).toEqual(cleanUpNext)
    })
  })
})
