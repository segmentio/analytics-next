import fetch from 'node-fetch'

const majorVersion = parseInt(
  process.version.replace('v', '').split('.')[0],
  10
)

if (majorVersion >= 18) {
  ;(globalThis as any).fetch = fetch // polyfill fetch so nock will work on node >= 18 -- see: https://github.com/nock/nock/issues/2336
}
