const fetch = require('node-fetch')

// eslint-disable-next-line no-undef
globalThis.fetch = fetch // polyfill fetch so nock will work correctly on node 18 (https://github.com/nock/nock/issues/2336)
