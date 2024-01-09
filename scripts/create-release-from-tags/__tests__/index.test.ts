import { parseReleaseNotes, parseRawTags } from '..'
import fs from 'fs'
import path from 'path'

const readFixture = (filename: string) => {
  return fs.readFileSync(path.join(__dirname, 'fixtures', filename), {
    encoding: 'utf8',
  })
}

describe('parseReleaseNotes', () => {
  test('should work with reg example', () => {
    const fixture = readFixture('reg-example.md')
    expect(parseReleaseNotes(fixture, '1.99.0')).toMatchInlineSnapshot(`
      "
          ### Minor Changes

          * [#606](https://github.com/segmentio/analytics-next/pull/606) [\\\`b9c6356\\\`](https://github.com/segmentio/analytics-next/commit/b9c6356b7d35ee8acb6ecbd1eebc468d18d63958) Thanks [@silesky] - foo!)

          ### Patch Changes

          * [#404](https://github.com/segmentio/analytics-next/pull/404) [\\\`b9abc6\\\`](https://github.com/segmentio/analytics-next/commit/b9c6356b7d35ee8acb6ecbd1eebc468d18d63958) Thanks [@silesky] - bar!)
      "
    `)
  })

  test('should work if first release', () => {
    const fixture = readFixture('first-release-example.md')
    expect(parseReleaseNotes(fixture, '1.99.0')).toMatchInlineSnapshot(`
      "
          ### Minor Changes

          * [#606](https://github.com/segmentio/analytics-next/pull/606) [\\\`b9c6356\\\`](https://github.com/segmentio/analytics-next/commit/b9c6356b7d35ee8acb6ecbd1eebc468d18d63958) Thanks [@silesky] - foo!)

          ### Patch Changes

          * [#404](https://github.com/segmentio/analytics-next/pull/404) [\\\`b9abc6\\\`](https://github.com/segmentio/analytics-next/commit/b9c6356b7d35ee8acb6ecbd1eebc468d18d63958) Thanks [@silesky] - bar!)"
    `)
  })
})

describe('parseRawTags', () => {
  test('should work if all are on a single line', () => {
    const rawTags =
      '@segment/analytics-next@2.1.1 @segment/analytics-foo@1.0.1 @segment/analytics-core@1.0.0'
    const tags = parseRawTags(rawTags)
    expect(tags).toMatchInlineSnapshot(`
      [
        {
          "name": "@segment/analytics-next",
          "raw": "@segment/analytics-next@2.1.1",
          "versionNumber": "2.1.1",
        },
        {
          "name": "@segment/analytics-foo",
          "raw": "@segment/analytics-foo@1.0.1",
          "versionNumber": "1.0.1",
        },
        {
          "name": "@segment/analytics-core",
          "raw": "@segment/analytics-core@1.0.0",
          "versionNumber": "1.0.0",
        },
      ]
    `)
  })
  test('should work if there are multiple columns', () => {
    const rawTags = `
    @segment/analytics-next@2.1.1  @segment/analytics-foo@1.0.1
    @segment/analytics-core@1.0.0  @segment/analytics-bar@1.0.1
    `
    const tags = parseRawTags(rawTags)
    expect(tags).toMatchInlineSnapshot(`
      [
        {
          "name": "@segment/analytics-next",
          "raw": "@segment/analytics-next@2.1.1",
          "versionNumber": "2.1.1",
        },
        {
          "name": "@segment/analytics-foo",
          "raw": "@segment/analytics-foo@1.0.1",
          "versionNumber": "1.0.1",
        },
        {
          "name": "@segment/analytics-core",
          "raw": "@segment/analytics-core@1.0.0",
          "versionNumber": "1.0.0",
        },
        {
          "name": "@segment/analytics-bar",
          "raw": "@segment/analytics-bar@1.0.1",
          "versionNumber": "1.0.1",
        },
      ]
    `)
  })
  test('should work if there are many many columns', () => {
    const rawTags = `
    @segment/analytics-next@2.1.1  @segment/analytics-foo@1.0.1 @segment/analytics-bar@1.0.1
    @segment/analytics-next@2.1.1  @segment/analytics-baz@1.0.1 @segment/analytics-foobar@1.0.1
    @segment/analytics-core@1.0.0
    `
    const tags = parseRawTags(rawTags)
    expect(tags).toMatchInlineSnapshot(`
      [
        {
          "name": "@segment/analytics-next",
          "raw": "@segment/analytics-next@2.1.1",
          "versionNumber": "2.1.1",
        },
        {
          "name": "@segment/analytics-foo",
          "raw": "@segment/analytics-foo@1.0.1",
          "versionNumber": "1.0.1",
        },
        {
          "name": "@segment/analytics-bar",
          "raw": "@segment/analytics-bar@1.0.1",
          "versionNumber": "1.0.1",
        },
        {
          "name": "@segment/analytics-next",
          "raw": "@segment/analytics-next@2.1.1",
          "versionNumber": "2.1.1",
        },
        {
          "name": "@segment/analytics-baz",
          "raw": "@segment/analytics-baz@1.0.1",
          "versionNumber": "1.0.1",
        },
        {
          "name": "@segment/analytics-foobar",
          "raw": "@segment/analytics-foobar@1.0.1",
          "versionNumber": "1.0.1",
        },
        {
          "name": "@segment/analytics-core",
          "raw": "@segment/analytics-core@1.0.0",
          "versionNumber": "1.0.0",
        },
      ]
    `)
  })
  test('should work if there is newline characters', () => {
    const rawTags = `
    @segment/analytics-next@2.1.1
    @segment/analytics-core@1.0.0
    `
    const tags = parseRawTags(rawTags)
    expect(tags).toMatchInlineSnapshot(`
      [
        {
          "name": "@segment/analytics-next",
          "raw": "@segment/analytics-next@2.1.1",
          "versionNumber": "2.1.1",
        },
        {
          "name": "@segment/analytics-core",
          "raw": "@segment/analytics-core@1.0.0",
          "versionNumber": "1.0.0",
        },
      ]
    `)
  })
})
