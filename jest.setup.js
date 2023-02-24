const { TextEncoder, TextDecoder } = require('util')
const { setImmediate } = require('timers')

// fix: "ReferenceError: TextEncoder is not defined" after upgrading JSDOM
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
// fix: jsdom uses setImmediate under the hood for preflight XHR requests,
// and jest removed setImmediate, so we need to provide it to prevent console
// logging ReferenceErrors made by integration tests that call Amplitude.
global.setImmediate = setImmediate
