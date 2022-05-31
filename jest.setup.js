const { TextEncoder, TextDecoder } = require('util')

// fix: "ReferenceError: TextEncoder is not defined" after upgrading JSDOM
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
