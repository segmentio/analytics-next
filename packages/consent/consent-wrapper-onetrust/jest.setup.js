const fetch = require('node-fetch')
const { TextEncoder, TextDecoder } = require('util')

// fix: "ReferenceError: TextEncoder is not defined" after upgrading JSDOM
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// eslint-disable-next-line no-undef
globalThis.fetch = fetch // polyfill fetch so nock will work correctly on node 18 (https://github.com/nock/nock/issues/2336)
