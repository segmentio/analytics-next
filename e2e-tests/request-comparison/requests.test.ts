import fs from 'fs-extra'
import path from 'path'
import cleanUp from './cleanUp'
import getFileContent from './getFileContent'
import { Cookie, NetworkRequest } from './types'

const PATH = path.join(process.cwd(), 'e2e-tests/data/requests/')

describe.skip('Compare requests for customer websites', () => {
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
      const cleanUpClassic = cleanUp(classicScenario.content).networkRequests
      const cleanUpNext = cleanUp(nextScenario!.content).networkRequests

      expect(cleanUpClassic).toEqual(cleanUpNext)
    })
  })
})

describe.skip('AJSC vs AJSN: Custom Runner', () => {
  const files = fs.readdirSync(PATH)

  const classic = getFileContent(
    files.filter((fileName) => fileName.includes('classic'))[0]
  )

  const next = getFileContent(
    files.filter((fileName) => fileName.includes('next'))[0]
  )

  it('setup', () => {
    expect(files).not.toBeNull()
  })

  it('compares integrations', () => {
    expect(classic.integrations).toEqual(next.integrations)
  })

  it('compares cookies', () => {
    const cleanUp = (cookie: Cookie): Cookie => {
      cookie.expires = 0

      const randomIdRegexp = new RegExp(
        /ajs_anonymous_id|_ga|_gid|s_fid|amplitude_id/
      )

      if (randomIdRegexp.test(cookie.name)) {
        cookie.value = 'random'
      }

      // TODO (@juliofarah @danieljackins): AJS Classic doesn't escape the
      // cookie value; AJS Next removes the`%22`.
      // Should we worry about it ?
      cookie.value = cookie.value.replace(new RegExp('%22', 'g'), '')

      return cookie
    }

    const classicCookies = classic.cookies.map(cleanUp)

    const nextCookies = next.cookies
      .filter(
        (c: Cookie) =>
          // TODO (@juliofarah @danieljackins): AJS Next adds two additional cookies.
          // Is that OK?
          c.name !== 'ajs_group_properties' && c.name !== 'ajs_user_traits'
      )
      .map(cleanUp)

    expect(classicCookies).toEqual(nextCookies)
  })

  it('compares requests', () => {
    const cleanUp = (u: NetworkRequest): NetworkRequest => {
      delete u.postData.context.attempts
      delete u.postData.context.library
      delete u.postData.context.metrics
      u.url = u.url.replace('&next=on', '')

      if (u.postData._metadata && u.postData._metadata.bundled) {
        const sortedBundled = u.postData._metadata.bundled
          .filter((b: string) => b !== 'Segment.io')
          .sort()

        u.postData._metadata.bundled = sortedBundled

        // AJS Classic doesn't include bundledConfigIds (probably will on newer versions?),
        // but this field has been added to AJS Renderer a while ago;
        delete u.postData._metadata.bundledConfigIds
      }

      if (u.postData.properties) {
        if (u.postData.properties.search) {
          u.postData.properties.search = u.postData.properties.search.replace(
            '&next=on',
            ''
          )
        }
        if (u.postData.properties.url) {
          u.postData.properties.url = u.postData.properties.url.replace(
            '&next=on',
            ''
          )
        }
      }

      if (u.postData.context.page) {
        u.postData.context.page.url = u.postData.context.page.url.replace(
          '&next=on',
          ''
        )

        u.postData.context.page.search = u.postData.context.page.search.replace(
          '&next=on',
          ''
        )
      }

      return u
    }

    const classicRequests = classic.networkRequests.map(cleanUp)
    const nextRequests = next.networkRequests.map(cleanUp)

    expect(classicRequests.length).toBe(nextRequests.length)
    expect(classicRequests).toEqual(nextRequests)
  })
})
