import { parseReleaseNotes } from '..'
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

          * [#606](https://github.com/segmentio/analytics-next/pull/606) [\\\\\`b9c6356\\\\\`](https://github.com/segmentio/analytics-next/commit/b9c6356b7d35ee8acb6ecbd1eebc468d18d63958) Thanks [@silesky] - foo!)

          ### Patch Changes

          * [#404](https://github.com/segmentio/analytics-next/pull/404) [\\\\\`b9abc6\\\\\`](https://github.com/segmentio/analytics-next/commit/b9c6356b7d35ee8acb6ecbd1eebc468d18d63958) Thanks [@silesky] - bar!)
      "
    `)
  })

  test('should work if first release', () => {
    const fixture = readFixture('first-release-example.md')
    expect(parseReleaseNotes(fixture, '1.99.0')).toMatchInlineSnapshot(`
      "
          ### Minor Changes

          * [#606](https://github.com/segmentio/analytics-next/pull/606) [\\\\\`b9c6356\\\\\`](https://github.com/segmentio/analytics-next/commit/b9c6356b7d35ee8acb6ecbd1eebc468d18d63958) Thanks [@silesky] - foo!)

          ### Patch Changes

          * [#404](https://github.com/segmentio/analytics-next/pull/404) [\\\\\`b9abc6\\\\\`](https://github.com/segmentio/analytics-next/commit/b9c6356b7d35ee8acb6ecbd1eebc468d18d63958) Thanks [@silesky] - bar!)"
    `)
  })
})
