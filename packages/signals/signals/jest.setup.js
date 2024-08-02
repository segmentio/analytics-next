/* eslint-disable no-undef */
require('fake-indexeddb/auto')
globalThis.structuredClone = (v) => JSON.parse(JSON.stringify(v))
